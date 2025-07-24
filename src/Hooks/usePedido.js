// src/Hooks/usePedido.js
import { useState } from "react";
import axios from "axios";

export function usePedido() {
  const [pedido, setPedido] = useState([]);
  const [cliente, setCliente] = useState("");
  const [observacionGeneral, setObservacionGeneral] = useState("");
  const [observacionCliente, setObservacionCliente] = useState("");


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

  const limpiarPedido = () => {
    setPedido([]);
    setCliente("");
    setObservacionGeneral("");
    setObservacionCliente("");
  };

  const guardarCliente = (nombre) => {
    setCliente(nombre);
  };

  const guardarObservacionGeneral = (texto) => {
    setObservacionGeneral(texto);
  };

  const guardarObservacionCliente = (texto) => {
    setObservacionCliente(texto);
  };

  // ✅ URL del backend en Vercel
  const baseURL = import.meta.env.VITE_BACKEND_URL;

  // Función auxiliar para construir el cuerpo del pedido
const construirBodyPedido = () => {
  return {
    clientName: cliente.trim(),
    products: pedido.map((p) => {
      const producto = {
        idArticulo: p.idArticulo,
        cantidad: p.cantidad,
      };
      if (p.observacion?.trim()) {
        producto.observation = p.observacion.trim();
      }
      return producto;
    }),
    ...(observacionGeneral?.trim() && { observation: observacionGeneral.trim() }),
    fechaAlta: new Date().toISOString(),
  };
};

// Función principal para guardar el pedido
const guardarPedido = async (bodyPersonalizado = null) => {
  const body = bodyPersonalizado || construirBodyPedido();

  console.log("📦 Body que se envía al backend:", JSON.stringify(body, null, 2));

  try {
    const res = await axios.post(`${baseURL}/api/pedidos`, body, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (res.status === 200 || res.status === 201) {
      console.log('✅ Pedido guardado exitosamente:', res.data);
      return res;
    } else {
      throw new Error(`Error HTTP: ${res.status}`);
    }
  } catch (error) {
    console.error("❌ Error al guardar el pedido:", error);

    if (error.code === 'ECONNREFUSED') {
      throw new Error('No se puede conectar al servidor.');
    } else if (error.response) {
      throw new Error(`Error del servidor: ${error.response.status} - ${error.response.data?.message || 'Error desconocido'}`);
    } else if (error.request) {
      throw new Error('No se recibió respuesta del servidor.');
    } else {
      throw error;
    }
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