// src/Hooks/usePedido.js
import { useState } from "react";
import axios from "axios";

export function usePedido() {
  const [pedido, setPedido] = useState([]);
  const [observacionGeneral, setObservacionGeneral] = useState("");

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

  const actualizarProducto = (id, cambios) => {
    setPedido((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...cambios } : p))
    );
  };

  const eliminarProducto = (id) => {
    setPedido((prev) => prev.filter((p) => p.id !== id));
  };

  const guardarObservacionGeneral = (texto) => {
    setObservacionGeneral(texto);
  };

  const enviarPedido = async () => {
  const body = {
    productos: pedido.map((p) => ({
      id: p.id,
      cantidad: p.cantidad,
      observacion: p.observacion || "",
    })),
    observacionGeneral,
    fechaAlta: new Date().toISOString(),
  };

  try {
    const res = await axios.post("/api/pedidos", body);

    // Si deseas validar que fue exitoso:
    if (res.status !== 200) {
      throw new Error("Error al enviar el pedido");
    }

    // Resetear estado si fue exitoso
    setPedido([]);
    setObservacionGeneral("");
  } catch (error) {
    console.error("Error al enviar el pedido:", error);
  }
};
  return {
    pedido,
    observacionGeneral,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    guardarObservacionGeneral,
    enviarPedido,
  };
}
