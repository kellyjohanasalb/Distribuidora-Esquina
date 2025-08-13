import { useState } from "react";
import axios from "axios";

// Función para generar UUID (compatible con navegadores)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0,
          v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export function usePedido() {
  const [pedido, setPedido] = useState([]);
  const [cliente, setCliente] = useState("");
  const [observacionGeneral, setObservacionGeneral] = useState("");
  const [observacionCliente, setObservacionCliente] = useState("");

  // 🔹 Agregar producto al pedido
  const agregarProducto = (producto) => {
    const yaExiste = pedido.find((p) => p.idArticulo === producto.idArticulo);

    if (yaExiste) {
      actualizarProducto(producto.idArticulo, {
        cantidad: yaExiste.cantidad + 1,
      });
    } else {
      setPedido((prev) => [
        ...prev,
        {
          ...producto,
          cantidad: 1,
          observacion: producto.observacion || "",
          precio: producto.precio || null,
        },
      ]);
    }
  };

  // 🔹 Actualizar producto
  const actualizarProducto = (idArticulo, cambios) => {
    setPedido((prev) =>
      prev.map((p) => (p.idArticulo === idArticulo ? { ...p, ...cambios } : p))
    );
  };

  // 🔹 Eliminar producto
  const eliminarProducto = (idArticulo) => {
    setPedido((prev) => prev.filter((p) => p.idArticulo !== idArticulo));
  };

  // 🔹 Limpiar todo el pedido
  const limpiarPedido = () => {
    setPedido([]);
    setCliente("");
    setObservacionGeneral("");
    setObservacionCliente("");
  };

  // 🔹 Setters para cliente y observaciones
  const guardarCliente = (nombre) => {
    console.log("📝 Guardando cliente:", nombre);
    setCliente(nombre);
  };
  const guardarObservacionGeneral = (texto) => setObservacionGeneral(texto);
  const guardarObservacionCliente = (texto) => setObservacionCliente(texto);

  // 🔹 Guardar pedido en backend - CORREGIDO
  const guardarPedido = async (bodyPersonalizado = null) => {
    // Si se pasa un body personalizado, usarlo; sino usar los estados del hook
    const clienteAUsar = bodyPersonalizado?.clientName || cliente;
    const pedidoAUsar = bodyPersonalizado?.products || pedido;
    const observacionAUsar = bodyPersonalizado?.observation || observacionGeneral;


    // 1️⃣ Validaciones antes de enviar
    if (!clienteAUsar?.trim()) {
      console.warn("⚠️ Debes ingresar un nombre de cliente");
      throw new Error("Debes ingresar un nombre de cliente");
    }
    if (!pedidoAUsar?.length) {
      console.warn("⚠️ No puedes enviar un pedido vacío");
      throw new Error("No puedes enviar un pedido vacío");
    }

    // 2️⃣ Construir body del pedido
    const body = {
    frontId: generateUUID(),
    clientName: clienteAUsar.trim(),
    fechaAlta: new Date().toISOString(),
    observation: observacionAUsar?.trim() || null,
    products: pedidoAUsar.map((p) => ({
      idArticulo: p.idArticulo,
      cantidad: p.cantidad,
      precio: Math.max(Number(p.precio) || 1, 1),
      observation: p.observacion?.trim() || null
    }))
  };

    try {
      console.log("📤 Enviando al backend:", JSON.stringify(body, null, 2));
      const res = await axios.post(
        "https://remito-send-back.vercel.app/api/pedidos",
        body,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("✅ Pedido guardado:", res.data);

      // 5️⃣ Limpiar estado solo si usamos los estados del hook
      if (!bodyPersonalizado) {
        setPedido([]);
        setCliente("");
        setObservacionGeneral("");
      }

      return true;
    } catch (error) {
      console.error("❌ Error al guardar pedido:", error.response?.data || error.message);
      
      // Manejar errores específicos del backend
      let errorMessage = "Error al enviar el pedido";
      if (error.response?.data?.message) {
        errorMessage += ":\n" + error.response.data.message.join("\n");
      }
      
      throw new Error(errorMessage);
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