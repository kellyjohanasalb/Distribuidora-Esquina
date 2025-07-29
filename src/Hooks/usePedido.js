// src/Hooks/usePedido.js
import { useState } from "react";
import axios from "axios";

export function usePedido() {
  const [pedido, setPedido] = useState([]);
  const [cliente, setCliente] = useState("");
  const [observacionGeneral, setObservacionGeneral] = useState("");
  const [observacionCliente, setObservacionCliente] = useState("");

  // Agregar producto
  const agregarProducto = (producto) => {
    const yaExiste = pedido.find((p) => p.id === producto.id);
    if (yaExiste) {
      actualizarProducto(producto.id, {
        cantidad: yaExiste.cantidad + 1,
      });
    } else {
      setPedido((prev) => [...prev, { ...producto, cantidad: 1 }]);
    }
  };

  // Actualizar producto
  const actualizarProducto = (id, cambios) => {
    setPedido((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...cambios } : p))
    );
  };

  // Eliminar producto
  const eliminarProducto = (id) => {
    setPedido((prev) => prev.filter((p) => p.id !== id));
  };

  // Limpiar pedido
  const limpiarPedido = () => {
    setPedido([]);
    setCliente("");
    setObservacionGeneral("");
    setObservacionCliente("");
  };

  // Setters para datos del cliente y observaciones
  const guardarCliente = (nombre) => setCliente(nombre);
  const guardarObservacionGeneral = (texto) => setObservacionGeneral(texto);
  const guardarObservacionCliente = (texto) => setObservacionCliente(texto);

  // Generar ID dinámico para pedido
  const generarIdPedido = () => Date.now(); // Ejemplo: 1722245563000

  // Guardar pedido
  const guardarPedido = async (bodyPersonalizado = null) => {
    const body = bodyPersonalizado || {
      idPedido: generarIdPedido(),
      clientName: cliente.trim(),
      fechaPedido: new Date().toISOString(),
      observation: observacionGeneral?.trim() || "Sin observaciones",
      seen: false,
      productos: pedido.map((p) => ({
        idArticulo: p.idArticulo,
        cantidad: p.cantidad,
        observation: p.observacion?.trim() || "Sin observaciones",
        descripcion: p.articulo,
      })),
    };

    console.log("📦 Enviando body:", JSON.stringify(body, null, 2));

    try {
      const res = await axios.post(
        `https://remito-send-back.vercel.app/api/pedidos`,
        body,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("✅ Pedido guardado:", res.data);
      return res;
    } catch (error) {
      console.error("❌ Error al guardar el pedido:", error);
      throw error;
    }
  };

  return {
    pedido,
    cliente,
    observacionGeneral,
    observacionCliente,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    limpiarPedido,
    guardarCliente,
    guardarObservacionGeneral,
    guardarObservacionCliente,
    guardarPedido,
  };
}
