import { useState, useCallback, useEffect } from "react";
import axios from "axios";

// Función para generar UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0,
      v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Mapear funciones fuera del hook para evitar recreaciones
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

export function useOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const baseURL = "https://remito-send-back.vercel.app";

    // Función optimizada con useCallback
  const cargarOrdenes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const locales = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];

      if (!navigator.onLine) {
        console.warn("📴 Sin conexión: mostrando pedidos locales");
        setOrdenes(locales.map(mapearPendiente));
        return;
      }

      const res = await axios.get(`${baseURL}/api/pedidos`);
      const enviados = res.data.items || [];

      const pendientesMapeados = locales.map(mapearPendiente);
      const enviadosMapeados = enviados.map(mapearEnviado);

      const todasLasOrdenes = [...enviadosMapeados];
      pendientesMapeados.forEach(pendiente => {
        const yaExiste = todasLasOrdenes.some(orden => orden.id === pendiente.id);
        if (!yaExiste) {
          todasLasOrdenes.push(pendiente);
        }
      });

      setOrdenes(todasLasOrdenes);
    } catch (err) {
      if (err.message.includes("Network Error")) {
        console.warn("📴 Sin conexión: cargando pedidos locales");
        const locales = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];
        setOrdenes(locales.map(mapearPendiente));
      } else {
        setError(err.message || "Error al cargar órdenes");
        console.error("Error cargando órdenes:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [baseURL]);

  

  // Función optimizada para enviar pedidos
  const enviarPedidoBackend = useCallback(async (orden) => {
    try {
      setLoading(true);

      const datosParaEnvio = {
        frontId: generateUUID(),
        clientName: orden.originalData.clientName,
        products: orden.originalData.products,
        fechaAlta: orden.originalData.fechaAlta || new Date().toISOString()
      };

      if (orden.originalData.observation && 
          orden.originalData.observation.trim() !== "" &&
          orden.originalData.observation.trim() !== "Sin observaciones") {
        datosParaEnvio.observation = orden.originalData.observation.trim();
      }

      const response = await axios.post(`${baseURL}/api/pedidos`, datosParaEnvio);
      const nuevoId = response.data.idPedido || response.data.id;

      // Actualizar localStorage
      const pendientes = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];
      const nuevosPendientes = pendientes.filter(p => 
        Number(p.idPedido || p.id) !== Number(orden.id)
      );
      localStorage.setItem("pedidosPendientes", JSON.stringify(nuevosPendientes));

      // Actualizar estado
      setOrdenes(prev => prev.map(o => 
        o.id === orden.id ? {
          ...response.data,
          id: nuevoId,
          status: "Enviado",
          name: response.data.clientName,
          value: response.data.total || 0
        } : o
      ));

      return { success: true, nuevoId };
    } catch (err) {
      console.error("❌ Error enviando pedido:", err);
      throw new Error(err.message.includes("Network Error")
        ? "Sin conexión. Guarda el pedido como pendiente."
        : "Error al enviar pedido");
    } finally {
      setLoading(false);
    }
  }, [baseURL]);

  // Función optimizada para enviar todos los pendientes
  const enviarTodosPendientes = useCallback(async () => {
    try {
      setLoading(true);
      const pendientes = ordenes.filter(o => o.status === "Pendiente");

      if (pendientes.length === 0) {
        throw new Error("No hay pedidos pendientes para enviar");
      }

      const resultados = await Promise.allSettled(
        pendientes.map(pedido => enviarPedidoBackend(pedido))
      );

      const enviados = resultados.filter(r => r.status === "fulfilled").length;
      const errores = resultados.filter(r => r.status === "rejected");

      await cargarOrdenes();

      return {
        success: enviados > 0,
        enviados,
        errores: errores.length,
        detalles: errores.map(e => e.reason.message)
      };
    } catch (err) {
      console.error("❌ Error enviando pedidos masivo:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ordenes, enviarPedidoBackend, cargarOrdenes]);

  // Cargar órdenes al inicializar el hook
  useEffect(() => {
    cargarOrdenes();
  }, [cargarOrdenes]);


  return {
    ordenes,
    loading,
    error,
    cargarOrdenes,
    enviarPedidoBackend,
    enviarTodosPendientes
  };
}