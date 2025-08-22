/* eslint-disable no-unused-vars */
import 'bootstrap/dist/css/bootstrap.min.css';
import  axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useConexion from '../Hooks/useConexion.js';
import {usePedido} from '../Hooks/usePedido.js';
import useCatalogo from '../Hooks/useCatalogo.js'

import '../index.css';

const DistribuidoraEsquina = () => {
  const isOnline = useConexion();
  const navigate = useNavigate();
  const [imagenModal, setImagenModal] = useState(null);
  const [isEnviando, setIsEnviando] = useState(false);
  const [mostrarAñadir, setMostrarAñadir] = useState(false);
  const [mostrarBorrador, setMostrarBorrador] = useState(false);
  const modalRef = useRef(null);
  const modalContainerRef = useRef(null);

  const IMAGEN_POR_DEFECTO = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

 const {
    pedido,
    cliente,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    observacionGeneral,
    guardarObservacionGeneral,
    limpiarPedido,
    guardarPedido,
    guardarCliente,
    hayBorradorDisponible,
    recuperarBorrador,
    descartarBorrador
  } = usePedido();


  const {
    productos,
    rubros,
    busqueda,
    handleBusquedaChange,
    fetchProductos,
    hasNextPage,
  } = useCatalogo();

 // Fecha automática
  const [fechaFormateada] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  // Verificar si hay borrador disponible al cargar el componente
useEffect(() => {
  const borrador = localStorage.getItem('pedidoBorrador');
  if (borrador) {
    const parsedBorrador = JSON.parse(borrador);
    // Solo mostrar si el borrador tiene contenido válido
    if (parsedBorrador.pedido.length > 0 || 
        parsedBorrador.cliente.trim().length > 0 || 
        parsedBorrador.observacionGeneral.trim().length > 0) {
      setMostrarBorrador(true);
    }
  }
}, []);

   // Detectar clic fuera del modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setMostrarAñadir(false);
      }
    };
    if (mostrarAñadir) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarAñadir]);

   // Scroll infinito modal añadir
  useEffect(() => {
    if (!mostrarAñadir || !hasNextPage) return;
    const container = modalContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        fetchProductos(false);
      }
    };
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [mostrarAñadir, hasNextPage, fetchProductos]);


  // Validaciones
  const esPedidoValido = () => {
    return (
      pedido.length > 0 &&
      cliente.trim().length >= 1 &&
      cliente.trim().length <= 128 &&
      pedido.every(p => p.cantidad >= 1 && p.cantidad <= 9999) &&
      (!observacionGeneral || (observacionGeneral.length >= 1 && observacionGeneral.length <= 512)) &&
      pedido.every(p => !p.observacion || (p.observacion.length >= 1 && p.observacion.length <= 512))
    );
  };

  const puedeEnviar = () => {
    return isOnline && esPedidoValido() && !isEnviando;
  }; 

  // Manejar recuperación de borrador
  const manejarRecuperarBorrador = () => {
    recuperarBorrador();
    setMostrarBorrador(false);
  };

  const manejarDescartarBorrador = () => {
    descartarBorrador();
    setMostrarBorrador(false);
  };

   const agregarAlPedido = (item) => {
    const productoExistente = pedido.find(p => p.idArticulo === item.idArticulo);
    if (productoExistente) {
      actualizarProducto(productoExistente.id, {
        cantidad: productoExistente.cantidad + 1
      });
    } else {
      agregarProducto({
        id: item.idArticulo,
        idArticulo: item.idArticulo,
        codigo: item.codigo,
        articulo: item.descripcion,
        cantidad: 1,
        observacion: '',
      });
    }
    handleBusquedaChange({ target: { value: '' } });
  };

  const agregarYCerrar = (item) => {
    agregarAlPedido(item);
    setMostrarAñadir(false);
  };

  const totalProductos = pedido.reduce((total, p) => total + p.cantidad, 0);

  const handleChange = (e) => {
    const valor = e.target.value;
    if (valor.length <= 128) {
      guardarCliente(valor);
    }
  };

  // Función modificada para guardar pedido (estado pendiente) con ID único
 const guardarPedidoPendiente = async () => {
    if (pedido.length === 0) {
      alert("Debe agregar al menos un producto al pedido.");
      return;
    }

    if (!cliente.trim()) {
      alert("Por favor, ingresá el nombre del cliente.");
      return;
    }

    try {
      // Obtener pedidos pendientes existentes
      const pedidosGuardados = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];
      let idPedido;

      try {
        // Intentar obtener máximo ID (online + offline)
        const res = await axios.get("https://remito-send-back.vercel.app/api/pedidos");
        const enviados = res.data.items || [];

        // Calcular máximo ID considerando ambos orígenes
        const maxId = Math.max(
          23000,
          ...pedidosGuardados.map(p => p.idPedido).filter(id => id),
          ...enviados.map(p => p.idPedido).filter(id => id)
        );

        idPedido = maxId + 1;
      } catch (error) {
        // Modo offline: calcular máximo ID solo con locales
        console.warn("Modo offline para generar ID. Razón:", error.message);
        if (pedidosGuardados.length > 0) {
          const maxId = Math.max(...pedidosGuardados.map(p => p.idPedido).filter(id => id));
          idPedido = maxId + 1;
        } else {
          idPedido = 23001; // ID inicial si no hay pedidos
        }
      }

      // Calcular total del pedido
      const total = pedido.reduce((acc, p) => {
        const productoEnCatalogo = productos.find(prod => prod.idArticulo === p.idArticulo);
        const precio = productoEnCatalogo ? parseFloat(productoEnCatalogo.precioVenta) : 0;
        return acc + (precio * p.cantidad);
      }, 0);

      // Mapear productos para guardar
      const productosMapeados = pedido.map(p => {
        const productoEnCatalogo = productos.find(prod => prod.idArticulo === p.idArticulo);
        const precio = productoEnCatalogo ? parseFloat(productoEnCatalogo.precioVenta) : 1;
        const producto = {
          idArticulo: p.idArticulo,
          cantidad: p.cantidad,
          precio,
        };
        if (p.observacion?.trim()) {
          producto.observation = p.observacion.trim();
        }
        return producto;
      });

      // Construir cuerpo del pedido
      const body = {
        idPedido,
        clientName: cliente.trim(),
        products: productosMapeados,
        fechaAlta: new Date().toISOString(),
        total,
        observation: observacionGeneral?.trim() || "Sin observaciones",
        status: "Pendiente"
      };

      // Verificar si el ID ya existe
      if (pedidosGuardados.some(p => p.idPedido === idPedido)) {
        alert("⚠️ Ya existe un pedido con este ID. Intente nuevamente.");
        return;
      }

      // Guardar en localStorage
      pedidosGuardados.push(body);
      localStorage.setItem("pedidosPendientes", JSON.stringify(pedidosGuardados));
      alert(`✅ Pedido guardado localmente con ID: ${idPedido}`);
      limpiarPedido();
    } catch (error) {
      console.error("❌ Error al guardar pedido local:", error);
      alert("Error al guardar el pedido local:\n" + error.message);
    }
  };


  // Función para enviar pedido (estado enviado)
     const enviarPedido = async () => {
    if (!puedeEnviar()) {
      if (!isOnline) {
        alert("No hay conexión a internet.");
        return;
      }
      if (!esPedidoValido()) {
        alert("El pedido no es válido.");
        return;
      }
      return;
    }
    const confirmacion = window.confirm(`¿Enviar este pedido? Cliente: ${cliente}`);
    if (!confirmacion) return;
    setIsEnviando(true);
    try {
      const productosMapeados = pedido.map(p => {
        const productoEnCatalogo = productos.find(prod => prod.idArticulo === p.idArticulo);
        return {
          idArticulo: p.idArticulo,
          cantidad: p.cantidad,
          precio: productoEnCatalogo ? parseFloat(productoEnCatalogo.precioVenta) : 1,
          observation: p.observacion?.trim() || null
        };
      });
      const body = {
        clientName: cliente.trim(),
        products: productosMapeados,
        fechaAlta: new Date().toISOString(),
        observation: observacionGeneral?.trim() || null
      };
      await guardarPedido(body);
      limpiarPedido();
      navigate('/ordenes', { replace: true });
    } catch (error) {
      console.error("❌ Error completo:", error);
      alert("Error al enviar el pedido.");
    } finally {
      setIsEnviando(false);
    }
  };


  return (
    <div style={{ backgroundColor: '#f7dc6f', minHeight: '100vh' }}>
      {/* MODAL DE BORRADOR DISPONIBLE */}
      {mostrarBorrador && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{
            display: 'block',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1060,
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded shadow">
              <div className="modal-header border-0 bg-warning">
                <h5 className="modal-title fw-bold text-dark">
                  📝 Borrador Disponible
                </h5>
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  Se detectó un pedido en progreso que no fue completado. 
                  ¿Deseas recuperar este borrador o empezar un pedido nuevo?
                </p>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={manejarDescartarBorrador}
                  >
                    🗑️ Descartar
                  </button>
                  <button
                    className="btn btn-warning"
                    onClick={manejarRecuperarBorrador}
                  >
                    🔄 Recuperar Borrador
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="shadow-sm mb-4" style={{ backgroundColor: '#f7dc6f' }}>
        <div className="container-fluid py-3">
          <div className="row align-items-center">
            <div className="col-12 col-md-6">
              <div className="d-flex align-items-center">
                <img
                  src="/logo-distruidora/logo.png"
                  alt="Distribuidora Esquina"
                  className="me-3 rounded shadow"
                  style={{ width: '120px', height: '120px' }}
                />
                <div>
                  <h1 className="h4 mb-0 fw-bold text-success">Distribuidora</h1>
                  <small className="fw-semibold text-success">ESQUINA</small>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 mt-2 mt-md-0">
              <div className="d-flex align-items-center justify-content-md-end">
                {/* Estado de conexión */}
                <div className={`badge ${isOnline ? 'bg-success' : 'bg-danger'} me-3`}>
                  {isOnline ? '🟢 En línea' : '🔴 Sin conexión'}
                </div>

                {/* CLIENTE */}
                <div
                  className="d-flex align-items-center rounded-pill px-3 py-1 me-3"
                  style={{ backgroundColor: '#298143' }}
                >
                  <span className="me-2" style={{ fontSize: '1.2rem' }}>👤</span>
                  <input
                    type="text"
                    value={cliente}
                    onChange={handleChange}
                    placeholder="Nombre cliente"
                    className="form-control form-control-sm border-0 bg-transparent text-white"
                    style={{ width: '150px' }}
                    maxLength={128}
                  />
                </div>

                {/* FOTO DE USUARIO */}
                <div
                  className="rounded-circle overflow-hidden"
                  style={{ width: '40px', height: '40px' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                    alt="Usuario"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="container-fluid px-4">
        {/* Título y fecha */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
          <div>
            <h2 className="h3 text-dark fw-bold mb-2">Nuevos Pedidos</h2>
            <div className="bg-success rounded" style={{ width: '80px', height: '4px' }}></div>
          </div>
          <div className="text-muted fw-medium mt-2 mt-md-0">
            {fechaFormateada}
          </div>
        </div>

        {/* Buscador */}
        <div className="mb-3 position-relative">
          <span
            className="position-absolute top-50 start-0 translate-middle-y ms-3"
            style={{ fontSize: '1.2rem' }}
          >
            🔍
          </span>
          <input
            type="text"
            className="form-control ps-5"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={handleBusquedaChange}
          />

          {busqueda.length >= 2 && productos.length > 0 && (
            <div
              className="position-absolute bg-white shadow rounded mt-2 p-2 z-3"
              style={{
                top: '100%',
                left: 0,
                right: 0,
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000
              }}
            >
              <table className="table table-bordered table-sm mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Código</th>
                    <th>Artículo</th>
                    <th>Unitario</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((item) => (
                    <tr key={item.idArticulo}>
                      <td>{item.idArticulo}</td>
                      <td>{item.descripcion}</td>
                      <td>${parseFloat(item.precioVenta).toFixed(2)}</td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => setImagenModal(item.imagen || IMAGEN_POR_DEFECTO)}
                          >
                            Ver Imagen
                          </button>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => agregarAlPedido(item)}
                          >
                            Agregar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasNextPage && (
                <button
                  className="btn btn-link mt-2"
                  onClick={() => fetchProductos(false)}
                >
                  Ver más...
                </button>
              )}
            </div>
          )}
        </div>

        {/* Botón Añadir */}
        <div className="d-flex justify-content-end mb-4">
          <button
            className="btn btn-success d-flex align-items-center"
            onClick={() => setMostrarAñadir(!mostrarAñadir)}
          >
            <span className="me-2">➕</span>
            Añadir
          </button>
        </div>

        {/* MODAL FLOTANTE PARA AÑADIR PRODUCTOS */}
        {mostrarAñadir && (
          <div
            ref={modalRef}
            className="position-absolute bg-white shadow rounded mt-2 p-3 z-3"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'hidden',
              zIndex: 1050,
              border: '2px solid #298143'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-success m-0">Seleccionar Productos</h5>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => setMostrarAñadir(false)}
              >
                Cerrar
              </button>
            </div>

            <div
              ref={modalContainerRef}
              style={{ maxHeight: '70vh', overflowY: 'auto' }}
            >
              {Object.entries(
                productos.reduce((acc, p) => {
                  const rubroNombre =
                    rubros.find((r) => r.id === p.idRubro)?.descripcion || "Otros";
                  if (!acc[rubroNombre]) acc[rubroNombre] = [];
                  acc[rubroNombre].push(p);
                  return acc;
                }, {})
              ).map(([rubro, items]) => (
                <div key={rubro} className="mb-4">
                  <h6 className="fw-bold text-success border-bottom pb-1">
                    {rubro}
                  </h6>

                  <div className="table-responsive">
                    <table className="table table-bordered table-sm">
                      <thead className="table-light">
                        <tr>
                          <th>Código</th>
                          <th>Artículo</th>
                          <th>Unitario</th>
                          <th className="text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.idArticulo}>
                            <td>{item.idArticulo}</td>
                            <td>{item.descripcion}</td>
                            <td>${parseFloat(item.precioVenta).toFixed(2)}</td>
                            <td className="text-center">
                              <div className="d-flex justify-content-center gap-2">
                                <button
                                  className="btn btn-sm btn-info"
                                  onClick={() => setImagenModal(item.imagen || IMAGEN_POR_DEFECTO)}
                                >
                                  Ver Imagen
                                </button>
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => agregarYCerrar(item)}
                                >
                                  Añadir
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              {hasNextPage && (
                <div className="text-center mt-3">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lista de productos agregados CON FONDO BLANCO */}
        {pedido.length > 0 && (
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Artículos agregados</h5>
              <div className="table-responsive">
                <table className="table table-bordered table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Código</th>
                      <th>Artículo</th>
                      <th>Cantidad</th>
                      <th>Observación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.map((item) => {
                      const producto = productos.find(p => p.idArticulo === item.idArticulo);
                      const imagen = producto?.imagen || IMAGEN_POR_DEFECTO;

                      return (
                        <tr key={item.idArticulo}>
                          <td>{item.idArticulo}</td>
                          <td>{item.articulo}</td>
                          <td>
                            <div className="d-flex flex-wrap align-items-center justify-content-center">
                              <button
                                className="btn btn-sm btn-outline-secondary me-1 mb-1"
                                onClick={() =>
                                  actualizarProducto(item.idArticulo, {
                                    cantidad: item.cantidad > 1 ? item.cantidad - 1 : 1,
                                  })
                                }
                                disabled={item.cantidad <= 1}
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min="1"
                                max="9999"
                                className="form-control form-control-sm text-center mb-1 input-cantidad"
                                style={{ width: '70px' }}
                                value={item.cantidad === 0 ? "" : item.cantidad}
                                onChange={(e) => {
                                  const valor = e.target.value;
                                  if (valor === "") {
                                    actualizarProducto(item.idArticulo, { cantidad: 0 });
                                    return;
                                  }
                                  const numero = parseInt(valor);
                                  if (!isNaN(numero) && numero >= 1 && numero <= 9999) {
                                    actualizarProducto(item.idArticulo, { cantidad: numero });
                                  }
                                }}
                                onBlur={(e) => {
                                  const valor = parseInt(e.target.value);
                                  actualizarProducto(item.idArticulo, {
                                    cantidad: isNaN(valor) || valor < 1 ? 1 : Math.min(valor, 9999)
                                  });
                                }}
                              />
                              <button
                                className="btn btn-sm btn-outline-secondary ms-1 mb-1"
                                onClick={() =>
                                  actualizarProducto(item.idArticulo, {
                                    cantidad: Math.min(item.cantidad + 1, 9999),
                                  })
                                }
                                disabled={item.cantidad >= 9999}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={item.observacion}
                              maxLength={512}
                              onChange={(e) =>
                                actualizarProducto(item.idArticulo, {
                                  observacion: e.target.value,
                                })
                              }
                              placeholder="Observación (opcional)"
                            />
                            {item.observacion && (
                              <small className="text-muted">
                                {item.observacion.length}/512
                              </small>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-2 flex-wrap justify-content-center">
                              <button
                                className="btn btn-sm btn-info"
                                onClick={() => setImagenModal(imagen)}
                              >
                                Ver Imagen
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => {
                                  if (window.confirm(`¿Eliminar "${item.articulo}" del pedido?`)) {
                                    eliminarProducto(item.idArticulo);
                                  }
                                }}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>

                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* Observación General */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-2">
            <h5 className="mb-0 me-2">Observación General</h5>
          </div>
          <div className="row">
            <div className="col-12 col-md-20 col-lg-6">
              <textarea
                className="form-control rounded-0 border-0 border-bottom"
                rows={2}
                placeholder="Instrucciones, comentarios o notas para este pedido..."
                value={observacionGeneral}
                maxLength={512}
                onChange={(e) => guardarObservacionGeneral(e.target.value)}
                style={{
                  minHeight: '60px',
                  resize: 'vertical',
                  backgroundColor: '#F0F0F0',
                  borderBottom: '2px solid #298143 !important'
                }}
              />
              <div className="d-flex justify-content-end">
                {observacionGeneral && (
                  <small className="text-muted">
                    {observacionGeneral.length}/512 caracteres
                  </small>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Información de validación */}
        {!esPedidoValido() && pedido.length > 0 && (
          <div className="alert alert-warning " role="alert">
            <h9>Revise los siguientes puntos para poder enviar:</h9>
            <ul className="mb-0 ">
              {!cliente.trim() && <li>Ingrese el nombre del cliente</li>}
              {cliente.trim().length > 128 && <li>El nombre del cliente no puede exceder 128 caracteres</li>}
              {pedido.some(p => p.cantidad < 1 || p.cantidad > 9999) && <li>Las cantidades deben estar entre 1 y 9999</li>}
              {observacionGeneral && observacionGeneral.length > 512 && <li>La observación general no puede exceder 512 caracteres</li>}
              {pedido.some(p => p.observacion && p.observacion.length > 512) && <li>Las observaciones de productos no pueden exceder 512 caracteres</li>}
            </ul>
          </div>
        )}

        <div className="mb-4">
          <div className="row align-items-center">
            <div className="col-12 col-md-6">
              <div className="text-center text-md-start">
                <p className="text-muted mb-1">Total de productos:</p>
                <h3 className="text-success fw-bold mb-0">{totalProductos}</h3>
              </div>
            </div>
            <div className="col-12 col-md-6 mt-3 mt-md-0">
              <div className="d-flex justify-content-center justify-content-md-end">
                <button
                  className="btn btn-outline-danger fw-semibold px-5 py-2"
                  onClick={() => {
                    if (window.confirm("¿Deshacer todo el pedido?")) {
                      limpiarPedido();
                    }
                  }}
                >
                  ❌ Deshacer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="d-flex justify-content-end align-items-center my-4 gap-3">
          <button
            className="btn btn-outline-success fw-semibold px-4 py-2"
            onClick={guardarPedidoPendiente}
            disabled={pedido.length === 0 || !cliente.trim()}
          >
            💾 Guardar
          </button>

          <button
            className={`btn fw-semibold px-4 py-2 ${puedeEnviar() ? 'btn-outline-success' : 'btn-outline-success'}`}
            onClick={enviarPedido}
            disabled={!puedeEnviar()}
            title={
              !isOnline
                ? "Sin conexión a internet"
                : !esPedidoValido()
                  ? "Pedido no válido"
                  : "Enviar pedido"
            }
          >
            {isEnviando ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Enviando...
              </>
            ) : (
              <>
                📤 Enviar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navegación inferior */}
      <nav className="fixed-bottom mb-4 bg-transparent">
        <div className="d-flex justify-content-around align-items-center">
          <Link to="/" className="btn btn-success d-flex align-items-center gap-2 px-4 py-2 shadow rounded-pill">
            📋 <span className="fw-semibold text-white">Catálogo</span>
          </Link>
          <button className="btn btn-success d-flex align-items-center gap-2 px-4 py-2 shadow rounded-pill">
            ➕ <span className="fw-semibold text-white">Pedido</span>
          </button>
          <Link to='/ordenes' className="btn btn-success d-flex align-items-center gap-2 px-4 py-2 shadow rounded-pill">
            📄 <span className="fw-semibold text-white">Órdenes</span>
          </Link>
        </div>
      </nav>

      <div style={{ height: '80px' }}></div>

      {imagenModal && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{
            display: 'block',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1050,
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
          }}
          onClick={() => setImagenModal(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 rounded shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">Visor de Imagen</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setImagenModal(null)}
                ></button>
              </div>
              <div className="modal-body text-center">
                <img
                  src={imagenModal}
                  alt="Producto"
                  className="img-fluid rounded shadow"
                  style={{ maxHeight: '70vh' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistribuidoraEsquina;