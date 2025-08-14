import { useState, useEffect } from "react";
import axios from "axios";

// Función para generar UUID (compatible con navegadores)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0,
          v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Claves para localStorage
const PEDIDO_KEY = 'pedidoEnProgreso';
const CLIENTE_KEY = 'pedidoCliente';
const OBS_GENERAL_KEY = 'pedidoObservacionGeneral';
const OBS_CLIENTE_KEY = 'pedidoObservacionCliente';

export function usePedido() {
  // Inicializar estados leyendo de localStorage
  const [pedido, setPedido] = useState(() => {
    const savedPedido = localStorage.getItem(PEDIDO_KEY);
    return savedPedido ? JSON.parse(savedPedido) : [];
  });
  
  const [cliente, setCliente] = useState(() => {
    return localStorage.getItem(CLIENTE_KEY) || "";
  });
  
  const [observacionGeneral, setObservacionGeneral] = useState(() => {
    return localStorage.getItem(OBS_GENERAL_KEY) || "";
  });
  
  const [observacionCliente, setObservacionCliente] = useState(() => {
    return localStorage.getItem(OBS_CLIENTE_KEY) || "";
  });

  // Guardar automáticamente en localStorage cuando cambia el estado
  useEffect(() => {
    localStorage.setItem(PEDIDO_KEY, JSON.stringify(pedido));
  }, [pedido]);

  useEffect(() => {
    localStorage.setItem(CLIENTE_KEY, cliente);
  }, [cliente]);

  useEffect(() => {
    localStorage.setItem(OBS_GENERAL_KEY, observacionGeneral);
  }, [observacionGeneral]);

  useEffect(() => {
    localStorage.setItem(OBS_CLIENTE_KEY, observacionCliente);
  }, [observacionCliente]);

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

  // 🔹 Limpiar todo el pedido (incluyendo localStorage)
  const limpiarPedido = () => {
    setPedido([]);
    setCliente("");
    setObservacionGeneral("");
    setObservacionCliente("");
    
    // Limpiar localStorage
    localStorage.removeItem(PEDIDO_KEY);
    localStorage.removeItem(CLIENTE_KEY);
    localStorage.removeItem(OBS_GENERAL_KEY);
    localStorage.removeItem(OBS_CLIENTE_KEY);
  };

  // 🔹 Setters para cliente y observaciones
  const guardarCliente = (nombre) => {
    console.log("📝 Guardando cliente:", nombre);
    setCliente(nombre);
  };
  
  const guardarObservacionGeneral = (texto) => setObservacionGeneral(texto);
  const guardarObservacionCliente = (texto) => setObservacionCliente(texto);

  // 🔹 Guardar pedido en backend
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
        limpiarPedido(); // Esto limpia el localStorage también
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