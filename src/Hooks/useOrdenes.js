// src/Hooks/useOrdenes.js
import { useState, useEffect } from "react";
import axios from "axios";

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
      
      // Usar los datos originales si están disponibles
      const datosParaEnvio = orden.originalData || {
        idPedido: orden.id,
        clientName: orden.name,
        products: orden.products || [],
        fechaAlta: orden.fechaAlta || new Date().toISOString(),
        observation: orden.observation || "Sin observaciones",
        total: orden.value || 0
      };

      // Enviar al backend
      await axios.post(`${baseURL}/api/pedidos`, datosParaEnvio, {
        headers: { "Content-Type": "application/json" }
      });

      // Eliminar del localStorage
      const pendientes = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];
      const pendientesFiltrados = pendientes.filter(p => (p.idPedido || p.id) !== orden.id);
      localStorage.setItem("pedidosPendientes", JSON.stringify(pendientesFiltrados));

      // Actualizar estado local
      setOrdenes(prev => 
        prev.map(o => 
          o.id === orden.id 
            ? { ...o, status: "Enviado", originalData: undefined }
            : o
        )
      );

      return { success: true };
    } catch (err) {
      console.error("❌ Error enviando pedido:", err);
      throw new Error(err.response?.data?.message || err.message || "Error al enviar pedido");
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

      let enviados = 0;
      let errores = [];

      for (const pedido of pendientes) {
        try {
          await enviarPedidoBackend(pedido);
          enviados++;
        } catch (error) {
          errores.push({ id: pedido.id, error: error.message });
        }
      }

      if (errores.length > 0) {
        console.warn("Algunos pedidos no se pudieron enviar:", errores);
      }

      // Limpiar localStorage de todos los enviados exitosamente
      if (enviados > 0) {
        const idsEnviados = pendientes
          .filter((_, index) => !errores.some(e => e.id === pendientes[index].id))
          .map(p => p.id);
        
        const pendientesRestantes = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];
        const pendientesFiltrados = pendientesRestantes.filter(
          p => !idsEnviados.includes(p.idPedido || p.id)
        );
        localStorage.setItem("pedidosPendientes", JSON.stringify(pendientesFiltrados));
      }

      return { 
        success: true, 
        enviados, 
        errores: errores.length,
        mensaje: `${enviados} pedidos enviados exitosamente${errores.length > 0 ? `, ${errores.length} con errores` : ''}`
      };
    } catch (err) {
      console.error("❌ Error enviando pedidos:", err);
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