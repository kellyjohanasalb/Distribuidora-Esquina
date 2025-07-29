// src/Hooks/useOrdenes.js
import { useState } from "react";
import axios from "axios";

export function useOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [ordenDetalle, setOrdenDetalle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const baseURL = import.meta.env.VITE_BACKEND_URL || "https://remito-send-back.vercel.app";

  // 🔹 Obtener todas las órdenes (con filtros opcionales)
  const obtenerOrdenes = async (filtros = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams(filtros).toString();
      const url = `${baseURL}/api/pedidos${queryParams ? `?${queryParams}` : ""}`;
      const res = await axios.get(url);
      setOrdenes(res.data.items || []);
    } catch (err) {
      setError(err.message || "Error al obtener órdenes");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Obtener una orden por ID
  const obtenerOrdenPorId = async (idPedido) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${baseURL}/api/pedidos/${idPedido}`);
      setOrdenDetalle(res.data || null);
    } catch (err) {
      setError(err.message || "Error al obtener la orden");
    } finally {
      setLoading(false);
    }
  };

  return {
    ordenes,
    ordenDetalle,
    loading,
    error,
    obtenerOrdenes,
    obtenerOrdenPorId,
  };
}
