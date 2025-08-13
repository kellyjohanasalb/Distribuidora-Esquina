import { useState, useEffect } from "react";
import axios from "axios";

// Función para generar UUID (misma que en usePedido.js)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0,
          v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export function useOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const baseURL = "https://remito-send-back.vercel.app";

  useEffect(() => {
    cargarOrdenes();
  }, []);

  // Generar ID único autoincremental
  const generarIdUnico = async () => {
    try {
      // Obtener el último ID del backend
      const res = await axios.get(`${baseURL}/api/pedidos`);
      const enviados = res.data.items || [];
      
      // Obtener pedidos pendientes del localStorage
      const pendientes = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];
      
      // Encontrar el ID más alto entre backend y localStorage
      const todosLosIds = [
        ...enviados.map(p => p.idPedido || p.id),
        ...pendientes.map(p => p.idPedido || p.id)
      ].filter(id => id && !isNaN(id));
      
      const maxId = todosLosIds.length > 0 ? Math.max(...todosLosIds) : 23000;
      
      return maxId + 1;
    } catch (error) {
      // Si falla, usar timestamp como fallback
      console.warn("Error generando ID, usando timestamp:", error);
      return Date.now();
    }
  };

  const cargarOrdenes = async () => {
    setLoading(true);
    setError(null);
    try {
      // Cargar pendientes locales
      const locales = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];
      
      // Cargar enviados del backend
      const res = await axios.get(`${baseURL}/api/pedidos`);
      const enviados = res.data.items || [];

      // Mapear datos para que coincidan con el formato esperado
      const pendientesMapeados = locales.map(pedido => ({
        id: pedido.idPedido || pedido.id,
        name: pedido.clientName || pedido.cliente || "Sin nombre",
        value: pedido.total || 0,
        status: "Pendiente",
        fechaAlta: pedido.fechaAlta,
        observation: pedido.observation,
        products: pedido.products || pedido.productos,
        originalData: pedido // Guardar datos originales para envío
      }));

      const enviadosMapeados = enviados.map(pedido => ({
        id: pedido.idPedido || pedido.id,
        name: pedido.clientName || pedido.cliente || "Sin nombre", 
        value: pedido.total || 0,
        status: "Enviado",
        fechaAlta: pedido.fechaAlta,
        observation: pedido.observation,
        products: pedido.products || pedido.productos
      }));

      // Combinar y eliminar duplicados (priorizar enviados)
      const todasLasOrdenes = [...enviadosMapeados];
      
      pendientesMapeados.forEach(pendiente => {
        const yaExiste = todasLasOrdenes.find(orden => orden.id === pendiente.id);
        if (!yaExiste) {
          todasLasOrdenes.push(pendiente);
        }
      });

      setOrdenes(todasLasOrdenes);
    } catch (err) {
      setError(err.message || "Error al cargar órdenes");
      console.error("Error cargando órdenes:", err);
    } finally {
      setLoading(false);
    }
  };

  const enviarPedidoBackend = async (orden) => {
    try {
      setLoading(true);
      
      // LIMPIAR PAYLOAD: Solo enviar campos que acepta el backend
      const datosParaEnvio = {
        frontId: generateUUID(), // AÑADIDO: campo requerido por el backend
        clientName: orden.originalData.clientName,
        products: orden.originalData.products.map(p => ({
          idArticulo: p.idArticulo,
          cantidad: p.cantidad,
          precio: p.precio || 1, // Asegurar precio mínimo
          observation: p.observation || null
        })),
        fechaAlta: orden.originalData.fechaAlta || new Date().toISOString()
      };

      // Solo agregar observation si existe y no está vacía
      if (orden.originalData.observation && 
          orden.originalData.observation.trim() !== "" && 
          orden.originalData.observation.trim() !== "Sin observaciones") {
        datosParaEnvio.observation = orden.originalData.observation.trim();
      }

      console.log("📤 Enviando payload limpio:", datosParaEnvio);
      
      // Enviar al backend
      const response = await axios.post(`${baseURL}/api/pedidos`, datosParaEnvio, {
        headers: { "Content-Type": "application/json" }
      });

      console.log("✅ Respuesta del backend:", response.data);

      // Obtener el ID asignado por el backend
      const nuevoId = response.data.idPedido || response.data.id;

      // Eliminar del localStorage usando el ID local
      const pendientes = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];
      const pendientesFiltrados = pendientes.filter(p => 
        (p.idPedido || p.id) !== orden.id
      );
      localStorage.setItem("pedidosPendientes", JSON.stringify(pendientesFiltrados));

      // Actualizar estado con el nuevo ID del backend
      setOrdenes(prev => 
        prev.map(o => 
          o.id === orden.id 
            ? { 
                ...response.data,
                id: nuevoId,
                status: "Enviado",
                name: response.data.clientName,
                value: response.data.total || 0
              } 
            : o
        )
      );

      return { success: true, nuevoId };
    } catch (err) {
      console.error("❌ Error enviando pedido:", err);
      console.error("❌ Respuesta completa:", err.response);
      
      // Mensaje de error más específico
      let errorMessage = "Error al enviar pedido";
      if (err.response?.data?.message) {
        // Unificar mensajes en un string legible
        if (Array.isArray(err.response.data.message)) {
          errorMessage = err.response.data.message.join(". ");
        } else {
          errorMessage = err.response.data.message;
        }
      } else if (err.response?.status === 400) {
        errorMessage = "Datos del pedido inválidos. Verifique la información.";
      } else if (err.response?.status === 500) {
        errorMessage = "Error interno del servidor. Intente más tarde.";
      } else if (err.message.includes("Network Error")) {
        errorMessage = "Error de conexión. Verifique su internet.";
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const enviarTodosPendientes = async () => {
    try {
      setLoading(true);
      const pendientes = ordenes.filter(o => o.status === "Pendiente");
      
      if (pendientes.length === 0) {
        throw new Error("No hay pedidos pendientes para enviar");
      }

      console.log(`📤 Enviando ${pendientes.length} pedidos pendientes...`);

      let enviados = 0;
      let errores = [];

      for (const pedido of pendientes) {
        try {
          console.log(`📤 Enviando pedido ID: ${pedido.id}...`);
          await enviarPedidoBackend(pedido);
          enviados++;
          console.log(`✅ Pedido ${pedido.id} enviado exitosamente`);
        } catch (error) {
          console.error(`❌ Error enviando pedido ${pedido.id}:`, error);
          errores.push({ id: pedido.id, error: error.message });
        }
      }

      // Recargar órdenes después del envío masivo
      await cargarOrdenes();

      const mensaje = enviados > 0 
        ? `✅ ${enviados} pedidos enviados exitosamente${errores.length > 0 ? `. ${errores.length} con errores.` : '.'}`
        : `❌ No se pudo enviar ningún pedido. ${errores.length} errores.`;

      return { 
        success: enviados > 0, 
        enviados, 
        errores: errores.length,
        mensaje,
        detalleErrores: errores
      };
    } catch (err) {
      console.error("❌ Error enviando pedidos masivo:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    ordenes,
    loading,
    error,
    cargarOrdenes,
    enviarPedidoBackend,
    enviarTodosPendientes,
    generarIdUnico
  };
}