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


// En la función normalizarFecha, asegúrate de manejar correctamente las fechas
const normalizarFecha = (fecha) => {
  if (!fecha) return new Date().toISOString();
  
  // Si ya es una fecha válida en formato ISO, devolverla
  if (typeof fecha === 'string' && fecha.includes('T')) {
    const date = new Date(fecha);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }
  
  // Si es una fecha en formato YYYY-MM-DD, convertir a ISO
  if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Añadir hora media UTC para evitar problemas de zona horaria
    return new Date(fecha + 'T12:00:00.000Z').toISOString();
  }
  
  // Intentar crear fecha válida
  const fechaObj = new Date(fecha);
  return isNaN(fechaObj.getTime()) ? new Date().toISOString() : fechaObj.toISOString();
};

// Mapear funciones mejoradas con manejo de fechas
const mapearPendiente = (pedido) => ({
      id: Number(pedido.idPedido || pedido.id),
      idPedido: pedido.idPedido || pedido.id,
      name: pedido.clientName || pedido.cliente || "Sin nombre",
      value: pedido.total || 0,
      status: "Pendiente",
      fechaAlta: normalizarFecha(pedido.fechaAlta),
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
            fechaAlta: normalizarFecha(pedido.fechaAlta),
            observation: pedido.observation || "Sin observaciones"
      }
});

const mapearEnviado = (pedido) => ({
      id: Number(pedido.idPedido || pedido.id),
      idPedido: pedido.idPedido || pedido.id,
      name: pedido.clientName || pedido.cliente || "Sin nombre",
      value: pedido.total || 0,
      status: "Enviado",
      fechaAlta: normalizarFecha(pedido.fechaPedido), // Usar fechaPedido primero
      observation: pedido.observation,
      products: pedido.products || pedido.productos
});

export function useOrdenes() {
      const [ordenes, setOrdenes] = useState([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);

      const baseURL = "https://remito-send-back.vercel.app";

      // Función para cargar órdenes con mejor manejo de fechas
      const cargarOrdenes = useCallback(async (fechaFiltro = null) => {
            setLoading(true);
            setError(null);

            try {
                  const locales = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];

                  if (!navigator.onLine) {
                        console.warn("🔴 Sin conexión: mostrando pedidos locales");
                        const pendientesMapeados = locales.map(mapearPendiente);
                        setOrdenes(pendientesMapeados);
                        return;
                  }

                  // Construir URL con filtro de fecha si se proporciona
                  let url = `${baseURL}/api/pedidos`;
                  if (fechaFiltro) {
                        const fecha = new Date(fechaFiltro);
                        const fechaStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
                        url += `?fecha=${fechaStr}`;
                  }

                  const res = await axios.get(url);
                  const enviados = res.data.items || [];

                  const pendientesMapeados = locales.map(mapearPendiente);
                  const enviadosMapeados = enviados.map(mapearEnviado);

                  // Combinar enviados y pendientes, evitando duplicados
                  const todasLasOrdenes = [...enviadosMapeados];
                  pendientesMapeados.forEach(pendiente => {
                        const yaExiste = todasLasOrdenes.some(orden =>
                              Number(orden.id) === Number(pendiente.id) ||
                              Number(orden.idPedido) === Number(pendiente.idPedido)
                        );
                        if (!yaExiste) {
                              todasLasOrdenes.push(pendiente);
                        }
                  });

                  setOrdenes(todasLasOrdenes);
            } catch (err) {
                  if (err.message.includes("Network Error") || err.code === 'NETWORK_ERROR') {
                        console.warn("🔴 Sin conexión: cargando pedidos locales");
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

      // Función para cargar órdenes por fecha específica
      const cargarOrdenesPorFecha = useCallback(async (fecha) => {
            return await cargarOrdenes(fecha);
      }, [cargarOrdenes]);

      // Función para cargar órdenes de hoy
      const cargarOrdenesHoy = useCallback(async () => {
            const hoy = new Date().toISOString().split('T')[0];
            return await cargarOrdenes(hoy);
      }, [cargarOrdenes]);

      // Función optimizada para enviar pedidos con mejor manejo de fechas
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

                  // Actualizar estado local
                  setOrdenes(prev => prev.map(o =>
                        Number(o.id) === Number(orden.id) ? {
                              ...response.data,
                              id: Number(nuevoId),
                              idPedido: nuevoId,
                              status: "Enviado",
                              name: response.data.clientName,
                              value: response.data.total || 0,
                              fechaAlta: normalizarFecha(response.data.fechaPedido || response.data.fechaAlta) // Usar fechaPedido
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
                  const pendientes = ordenes.filter(o =>
                        o.status?.toLowerCase() === "pendiente" ||
                        o.status?.toLowerCase() === "pending"
                  );

                  if (pendientes.length === 0) {
                        throw new Error("No hay pedidos pendientes para enviar");
                  }

                  const resultados = await Promise.allSettled(
                        pendientes.map(pedido => enviarPedidoBackend(pedido))
                  );

                  const enviados = resultados.filter(r => r.status === "fulfilled").length;
                  const errores = resultados.filter(r => r.status === "rejected");

                  // Recargar órdenes después del envío masivo
                  await cargarOrdenes();

                  const mensaje = errores.length > 0
                        ? `✅ ${enviados} pedidos enviados correctamente. ❌ ${errores.length} pedidos fallaron.`
                        : `✅ Todos los pedidos (${enviados}) fueron enviados correctamente.`;

                  return {
                        success: enviados > 0,
                        enviados,
                        errores: errores.length,
                        mensaje,
                        detalles: errores.map(e => e.reason?.message || "Error desconocido")
                  };
            } catch (err) {
                  console.error("❌ Error enviando pedidos masivo:", err);
                  throw err;
            } finally {
                  setLoading(false);
            }
      }, [ordenes, enviarPedidoBackend, cargarOrdenes]);

      // Función para filtrar órdenes por fecha (cliente)
      const filtrarOrdenesPorFecha = useCallback((fecha) => {
            if (!fecha) return ordenes;

            const fechaComparar = new Date(fecha).toDateString();
            return ordenes.filter(orden => {
                  if (!orden.fechaAlta) return false;
                  const fechaOrden = new Date(orden.fechaAlta).toDateString();
                  return fechaOrden === fechaComparar;
            });
      }, [ordenes]);

      // Función para obtener órdenes de hoy
      const obtenerOrdenesHoy = useCallback(() => {
            const hoy = new Date().toDateString();
            return ordenes.filter(orden => {
                  // Los pendientes siempre se muestran
                  if (orden.status?.toLowerCase() === "pendiente") return true;

                  // Los enviados solo si son de hoy
                  if (!orden.fechaAlta) return false;
                  const fechaOrden = new Date(orden.fechaAlta).toDateString();
                  return fechaOrden === hoy;
            });
      }, [ordenes]);

      // Función para obtener estadísticas
      const obtenerEstadisticas = useCallback(() => {
            const pendientes = ordenes.filter(o =>
                  o.status?.toLowerCase() === "pendiente" ||
                  o.status?.toLowerCase() === "pending"
            );

            const enviados = ordenes.filter(o =>
                  o.status?.toLowerCase() === "enviado" ||
                  o.status?.toLowerCase() === "sent"
            );

            const hoy = new Date().toDateString();
            const enviadosHoy = enviados.filter(o => {
                  if (!o.fechaAlta) return false;
                  return new Date(o.fechaAlta).toDateString() === hoy;
            });

            return {
                  totalOrdenes: ordenes.length,
                  pendientes: pendientes.length,
                  enviados: enviados.length,
                  enviadosHoy: enviadosHoy.length,
                  valorTotalPendientes: pendientes.reduce((sum, o) => sum + (o.value || 0), 0),
                  valorTotalEnviados: enviados.reduce((sum, o) => sum + (o.value || 0), 0)
            };
      }, [ordenes]);

      // Cargar órdenes al inicializar el hook
      useEffect(() => {
            cargarOrdenes();
      }, [cargarOrdenes]);

      return {
            ordenes,
            loading,
            error,
            // Funciones básicas
            cargarOrdenes,
            enviarPedidoBackend,
            enviarTodosPendientes,
            // Funciones con filtros de fecha
            cargarOrdenesPorFecha,
            cargarOrdenesHoy,
            filtrarOrdenesPorFecha,
            obtenerOrdenesHoy,
            // Estadísticas
            obtenerEstadisticas
      };
}