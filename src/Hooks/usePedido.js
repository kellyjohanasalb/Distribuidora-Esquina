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
const BORRADOR_KEY = 'pedidoBorrador'; // Nueva clave para borradores

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

  // 🔹 Función para verificar si hay un borrador disponible
  const hayBorradorDisponible = () => {
  const borradorGuardado = localStorage.getItem(BORRADOR_KEY);
  if (!borradorGuardado) return false;

  const borrador = JSON.parse(borradorGuardado);
  
  // Verificar si hay contenido en el borrador
  return (
    borrador.pedido.length > 0 || 
    borrador.cliente.trim().length > 0 || 
    borrador.observacionGeneral.trim().length > 0
  );
};

  // 🔹 Función para crear un borrador del estado actual
  const crearBorrador = () => {
    const borrador = {
      pedido: JSON.parse(localStorage.getItem(PEDIDO_KEY) || '[]'),
      cliente: localStorage.getItem(CLIENTE_KEY) || '',
      observacionGeneral: localStorage.getItem(OBS_GENERAL_KEY) || '',
      observacionCliente: localStorage.getItem(OBS_CLIENTE_KEY) || '',
      fechaCreacion: new Date().toISOString()
    };
    
    // Solo guardar si hay contenido significativo
    if (borrador.pedido.length > 0 || borrador.cliente.trim().length > 0 || borrador.observacionGeneral.trim().length > 0) {
      localStorage.setItem(BORRADOR_KEY, JSON.stringify(borrador));
    }
  };

  // 🔹 Función para recuperar el borrador
  const recuperarBorrador = () => {
    const borradorGuardado = localStorage.getItem(BORRADOR_KEY);
    if (borradorGuardado) {
      const borrador = JSON.parse(borradorGuardado);
      
      // Restaurar los estados
      setPedido(borrador.pedido || []);
      setCliente(borrador.cliente || '');
      setObservacionGeneral(borrador.observacionGeneral || '');
      setObservacionCliente(borrador.observacionCliente || '');
      
      // Restaurar en localStorage también
      localStorage.setItem(PEDIDO_KEY, JSON.stringify(borrador.pedido || []));
      localStorage.setItem(CLIENTE_KEY, borrador.cliente || '');
      localStorage.setItem(OBS_GENERAL_KEY, borrador.observacionGeneral || '');
      localStorage.setItem(OBS_CLIENTE_KEY, borrador.observacionCliente || '');
      
      // Eliminar el borrador una vez recuperado
      localStorage.removeItem(BORRADOR_KEY);
      
      console.log("📝 Borrador recuperado exitosamente");
    }
  };

  // 🔹 Función para descartar el borrador
  const descartarBorrador = () => {
    localStorage.removeItem(BORRADOR_KEY);
    console.log("🗑️ Borrador descartado");
  };

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
  // No crear borrador al limpiar intencionalmente
  setPedido([]);
  setCliente("");
  setObservacionGeneral("");
  setObservacionCliente("");
  
  // Limpiar localStorage
  localStorage.removeItem(PEDIDO_KEY);
  localStorage.removeItem(CLIENTE_KEY);
  localStorage.removeItem(OBS_GENERAL_KEY);
  localStorage.removeItem(OBS_CLIENTE_KEY);
  
  // También eliminar cualquier borrador existente
  localStorage.removeItem(BORRADOR_KEY);
};
  // 🔹 Setters para cliente y observaciones
  const guardarCliente = (nombre) => {
    console.log("🔐 Guardando cliente:", nombre);
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
        { headers: { "Content-Type": "application/json", "x-authentication": localStorage.getItem('authToken') }  }
      );

      console.log("✅ Pedido guardado:", res.data);

      // 5️⃣ Limpiar estado solo si usamos los estados del hook
      if (!bodyPersonalizado) {
        // No crear borrador cuando se envía exitosamente
        setPedido([]);
        setCliente("");
        setObservacionGeneral("");
        setObservacionCliente("");
        
        // Limpiar localStorage sin crear borrador
        localStorage.removeItem(PEDIDO_KEY);
        localStorage.removeItem(CLIENTE_KEY);
        localStorage.removeItem(OBS_GENERAL_KEY);
        localStorage.removeItem(OBS_CLIENTE_KEY);
        
        // También limpiar cualquier borrador existente
        localStorage.removeItem(BORRADOR_KEY);
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

  // 🔹 Detectar cuando el usuario está saliendo de la aplicación
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Solo crear borrador si hay contenido significativo
      if (pedido.length > 0 || cliente.trim() || observacionGeneral.trim()) {
        crearBorrador();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Solo crear borrador si hay contenido significativo
        if (pedido.length > 0 || cliente.trim() || observacionGeneral.trim()) {
          crearBorrador();
        }
      }
    };

    // Escuchar eventos de salida de la aplicación
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pedido, cliente, observacionGeneral]); // Dependencias para detectar cambios

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
    // Nuevas funciones para borradores
    hayBorradorDisponible,
    recuperarBorrador,
    descartarBorrador,
    crearBorrador
  };
}