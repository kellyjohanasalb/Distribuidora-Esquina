// src/components/ListaPedidos.jsx
import React, { useState, useEffect } from 'react';
import { usePedido } from '../Hooks/usePedido.js';

const ListaPedidos = () => {
  const [busquedaId, setBusquedaId] = useState('');
  const [pedidoEncontrado, setPedidoEncontrado] = useState(null);
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);

  const {
    pedidos,
    loading,
    error,
    obtenerPedidos,
    obtenerPedidoPorId
  } = usePedido();

  // Cargar pedidos al montar el componente
  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      await obtenerPedidos();
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    }
  };

  const buscarPedidoPorId = async () => {
    if (!busquedaId.trim()) {
      alert('Por favor, ingrese un ID de pedido');
      return;
    }

    try {
      const pedido = await obtenerPedidoPorId(busquedaId.trim());
      setPedidoEncontrado(pedido);
      setMostrarBusqueda(true);
    } catch (error) {
      alert(`Error al buscar pedido: ${error.message}`);
      setPedidoEncontrado(null);
    }
  };

  const cerrarBusqueda = () => {
    setMostrarBusqueda(false);
    setPedidoEncontrado(null);
    setBusquedaId('');
  };

  const formatearFecha = (fechaISO) => {
    return new Date(fechaISO).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularTotalProductos = (productos) => {
    return productos.reduce((total, p) => total + p.cantidad, 0);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f7dc6f', minHeight: '100vh', padding: '20px' }}>
      {/* Header */}
      <div className="mb-4">
        <h2 className="h3 text-dark fw-bold mb-2">Lista de Pedidos</h2>
        <div className="bg-success rounded" style={{ width: '120px', height: '4px' }}></div>
      </div>

      {/* Búsqueda por ID */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="fw-bold mb-3">🔍 Buscar Pedido por ID</h5>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Ingrese ID del pedido"
                value={busquedaId}
                onChange={(e) => setBusquedaId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && buscarPedidoPorId()}
              />
            </div>
            <div className="col-12 col-md-3">
              <button 
                className="btn btn-primary w-100"
                onClick={buscarPedidoPorId}
                disabled={!busquedaId.trim()}
              >
                Buscar
              </button>
            </div>
            <div className="col-12 col-md-3">
              <button 
                className="btn btn-outline-secondary w-100"
                onClick={cargarPedidos}
              >
                Actualizar Lista
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultado de búsqueda por ID */}
      {mostrarBusqueda && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">Resultado de Búsqueda</h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={cerrarBusqueda}>
                ✕ Cerrar
              </button>
            </div>
            
            {pedidoEncontrado ? (
              <div className="table-responsive">
                <table className="table table-bordered">
                  <tbody>
                    <tr>
                      <th style={{ width: '150px' }}>ID:</th>
                      <td>{pedidoEncontrado.id}</td>
                    </tr>
                    <tr>
                      <th>Cliente:</th>
                      <td>{pedidoEncontrado.clientName}</td>
                    </tr>
                    <tr>
                      <th>Fecha:</th>
                      <td>{formatearFecha(pedidoEncontrado.fechaAlta)}</td>
                    </tr>
                    <tr>
                      <th>Total Productos:</th>
                      <td>{calcularTotalProductos(pedidoEncontrado.products)}</td>
                    </tr>
                    <tr>
                      <th>Estado:</th>
                      <td>
                        <span className={`badge ${pedidoEncontrado.estado === 'enviado' ? 'bg-success' : 'bg-warning'}`}>
                          {pedidoEncontrado.estado || 'Sin estado'}
                        </span>
                      </td>
                    </tr>
                    {pedidoEncontrado.observation && (
                      <tr>
                        <th>Observación:</th>
                        <td>{pedidoEncontrado.observation}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Productos del pedido */}
                <h6 className="fw-bold mt-3 mb-2">Productos:</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th>ID Producto</th>
                        <th>Cantidad</th>
                        <th>Observación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidoEncontrado.products.map((producto, index) => (
                        <tr key={index}>
                          <td>{producto.id}</td>
                          <td>{producto.cantidad}</td>
                          <td>{producto.observation || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="alert alert-warning">
                No se encontró ningún pedido con el ID especificado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Lista de todos los pedidos */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="fw-bold mb-3">📄 Todos los Pedidos</h5>
          
          {pedidos.length === 0 ? (
            <div className="alert alert-info">
              No hay pedidos registrados.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total Productos</th>
                    <th>Estado</th>
                    <th>Observación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id}>
                      <td>
                        <code>{pedido.id}</code>
                      </td>
                      <td>{pedido.clientName}</td>
                      <td>{formatearFecha(pedido.fechaAlta)}</td>
                      <td>
                        <span className="badge bg-primary">
                          {calcularTotalProductos(pedido.products)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${pedido.estado === 'enviado' ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {pedido.estado || 'Sin estado'}
                        </span>
                      </td>
                      <td>
                        {pedido.observation ? (
                          <span title={pedido.observation}>
                            {pedido.observation.length > 30 
                              ? `${pedido.observation.substring(0, 30)}...` 
                              : pedido.observation}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            setBusquedaId(pedido.id);
                            buscarPedidoPorId();
                          }}
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Espaciado inferior */}
      <div style={{ height: '100px' }}></div>
    </div>
  );
};

export default ListaPedidos;