/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import axios from "axios";

// Función para generar UUID (misma que en usePedido.js)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
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
      const res = await axios.get(`${baseURL}/api/pedidos`);
      const enviados = res.data.items || [];
      const pendientes = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];

      const todosLosIds = [
        ...enviados.map(p => p.idPedido || p.id),
        ...pendientes.map(p => p.idPedido || p.id)
      ].filter(id => id && !isNaN(id));

      const maxId = todosLosIds.length > 0 ? Math.max(...todosLosIds) : 23000;
      return maxId + 1;
    } catch (error) {
      console.warn("Error generando ID, usando timestamp:", error);
      return Date.now();
    }
  };

  const cargarOrdenes = async () => {
    setLoading(true);
    setError(null);

    try {
      // 🔹 1. Siempre leer pedidos pendientes locales
      const locales = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];

      // 🔹 2. Si no hay internet, mostramos solo los pendientes
      if (!navigator.onLine) {
        console.warn("📴 Sin conexión: mostrando pedidos pendientes guardados localmente");
        const pendientesMapeados = locales.map(mapearPendiente);
        setOrdenes(pendientesMapeados);
        return;
      }

      // 🔹 3. Si hay internet, traer también enviados del backend
      const res = await axios.get(`${baseURL}/api/pedidos`);
      const enviados = res.data.items || [];

      const pendientesMapeados = locales.map(mapearPendiente);
      const enviadosMapeados = enviados.map(mapearEnviado);

      // 🔹 4. Combinar sin duplicar
      const todasLasOrdenes = [...enviadosMapeados];
      pendientesMapeados.forEach(pendiente => {
        const yaExiste = todasLasOrdenes.find(orden => orden.id === pendiente.id);
        if (!yaExiste) {
          todasLasOrdenes.push(pendiente);
        }
      });

      setOrdenes(todasLasOrdenes);
    } catch (err) {
      if (err.message.includes("Network Error")) {
        console.warn("📴 Sin conexión: cargando solo pedidos locales");
        const locales = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];
        setOrdenes(locales.map(mapearPendiente));
      } else {
        setError(err.message || "Error al cargar órdenes");
        console.error("Error cargando órdenes:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Funciones para mapear pedidos
  const mapearPendiente = (pedido) => ({
    id: Number(pedido.idPedido || pedido.id),
    name: pedido.clientName || pedido.cliente || "Sin nombre",
    value: pedido.total || 0,
    status: "Pendiente",
    fechaAlta: pedido.fechaAlta,
    observation: pedido.observation,
    products: pedido.products || pedido.productos,
    originalData: {
      clientName: pedido.clientName || pedido.cliente || "Sin nombre",
      products: (pedido.products || []).map(p => ({
        idArticulo: p.idArticulo,
        cantidad: p.cantidad,
        precio: p.precio || 1,
        observation: p.observation || null
      })),
      fechaAlta: pedido.fechaAlta,
      observation: pedido.observation || "Sin observaciones"
    }
  });

  const mapearEnviado = (pedido) => ({
    id: Number(pedido.idPedido || pedido.id),
    name: pedido.clientName || pedido.cliente || "Sin nombre",
    value: pedido.total || 0,
    status: "Enviado",
    fechaAlta: pedido.fechaAlta,
    observation: pedido.observation,
    products: pedido.products || pedido.productos
  });

  const enviarPedidoBackend = async (orden) => {
    try {
      setLoading(true);

      const datosParaEnvio = {
        frontId: generateUUID(),
        clientName: orden.originalData.clientName,
        products: orden.originalData.products.map(p => ({
          idArticulo: p.idArticulo,
          cantidad: p.cantidad,
          precio: p.precio || 1,
          observation: p.observation || null
        })),
        fechaAlta: orden.originalData.fechaAlta || new Date().toISOString()
      };

      if (
        orden.originalData.observation &&
        orden.originalData.observation.trim() !== "" &&
        orden.originalData.observation.trim() !== "Sin observaciones"
      ) {
        datosParaEnvio.observation = orden.originalData.observation.trim();
      }

      const response = await axios.post(`${baseURL}/api/pedidos`, datosParaEnvio, {
        headers: { "Content-Type": "application/json" }
      });

      const nuevoId = response.data.idPedido || response.data.id;

      // Eliminar del localStorage si se envió
      const pendientes = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];
      const pendientesFiltrados = pendientes.filter(p =>
        Number(p.idPedido || p.id) !== Number(orden.id)
      );
      localStorage.setItem("pedidosPendientes", JSON.stringify(pendientesFiltrados));

      // Actualizar estado
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
      throw new Error(err.message.includes("Network Error")
        ? "Sin conexión. Guarda el pedido como pendiente."
        : "Error al enviar pedido");
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

      await cargarOrdenes();

      return {
        success: enviados > 0,
        enviados,
        errores: errores.length,
        mensaje: `Enviados: ${enviados}, Errores: ${errores.length}`
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
