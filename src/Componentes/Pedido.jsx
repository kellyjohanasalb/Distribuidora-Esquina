import React, { useState, useEffect } from 'react';
import { usePedido } from '../Hooks/usePedido.js';
import useCatalogo from '../Hooks/useCatalogo.js';
import Select from 'react-select';
import '../index.css';

const DistribuidoraEsquina = () => {
  const [imagenModal, setImagenModal] = useState(null);

  const {
    pedido,
    agregarProducto,
    actualizarProducto,
    enviarPedido,
    eliminarProducto,
    observacionGeneral, // ← agregá esto
    guardarObservacionGeneral, // ← y esto también
  } = usePedido();

  const {
    productos,
    rubros,
    busqueda,
    filtroRubro,
    handleBusquedaChange,
    handleRubroChange,
    fetchProductos,
    hasNextPage,
    isLoading,
  } = useCatalogo();

  const [fechaPedido, setFechaPedido] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // ✅ CORRECCIÓN 1: Verificar duplicados y sumar cantidades
  const agregarAlPedido = (item) => {
    // Verificar si el producto ya existe en el pedido
    const productoExistente = pedido.find(p => p.idArticulo === item.idArticulo);

    if (productoExistente) {
      // Si existe, sumar la cantidad (cumple requerimiento)
      actualizarProducto(productoExistente.id, {
        cantidad: productoExistente.cantidad + 1
      });
    } else {
      // Si no existe, agregarlo normalmente (mantiene funcionalidad actual)
      agregarProducto({
        id: item.idArticulo,
        idArticulo: item.idArticulo,
        codigo: item.codigo,
        articulo: item.descripcion,
        cantidad: 1,
        observacion: '',
      });
    }

    // Mantener la limpieza del buscador (no tocar)
    handleBusquedaChange({ target: { value: '' } });
  };

  const opcionesRubros = rubros.map((r) => ({
    value: r.idRubro,
    label: r.nombre,
  }));

  const totalProductos = pedido.reduce((total, p) => total + p.cantidad, 0);

  return (
    <div style={{ backgroundColor: '#f7dc6f', minHeight: '100vh' }}>
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
                {/* CLIENTE */}
                <div
                  className="d-flex align-items-center rounded-pill px-3 py-1 me-3"
                  style={{ backgroundColor: '#298143' }}
                >
                  <span className="me-2" style={{ fontSize: '1.2rem' }}>👤</span>
                  <small className="fw-semibold text-white">Cliente</small>
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
        {/* Título */}
        <div className="mb-4">
          <h2 className="h3 text-dark fw-bold mb-2">Nuevos Pedidos</h2>
          <div className="bg-success rounded" style={{ width: '80px', height: '4px' }}></div>
        </div>

        {/* Search and Filters Card */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              {/* Buscador */}
              <div className="col-12 ">
                <div className="position-relative">
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
                              <td>{item.idArticulo}</td> {/* ✔ Código */}
                              <td>{item.descripcion}</td>
                              <td>${parseFloat(item.precioVenta).toFixed(2)}</td> {/* ✔ Precio */}
                              <td className="text-center">
                                <div className="d-flex justify-content-center gap-2">
                                  <button
                                    className="btn btn-sm btn-info"
                                    onClick={() => setImagenModal(item.imagen)}
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
              </div>

              {/* Rubros */}
              <div className="col-12 col-md-4">
                <div style={{ minWidth: '160px', maxWidth: '100%' }}>
                  <Select
                    options={[{ value: '', label: 'Todos los rubros' }, ...opcionesRubros]}
                    onChange={(selected) =>
                      handleRubroChange({ target: { value: selected?.value || '' } })
                    }
                    value={
                      opcionesRubros.find((o) => o.value === filtroRubro) || {
                        value: '',
                        label: 'Todos los rubros',
                      }
                    }
                    placeholder="🎯 Filtrar por rubro"
                    classNamePrefix="react-select"
                  />
                </div>
              </div>

              {/* Fecha */}
              <div className="col-12 col-md-3">
                <div className="position-relative">
                  <span
                    className="position-absolute top-50 start-0 translate-middle-y ms-3"
                    style={{ fontSize: '1.2rem' }}
                  >
                    📅
                  </span>
                  <input
                    type="date"
                    className="form-control ps-5"
                    value={fechaPedido}
                    onChange={(e) => setFechaPedido(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Botón Añadir */}
              <div className="col-12 col-md-2">
                <button className="btn btn-success w-100 d-flex align-items-center justify-content-center">
                  <span className="me-2">➕</span>
                  Añadir
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de productos agregados */}
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
                    {pedido.map((item) => (
                      <tr key={item.id}>
                        <td>{item.idArticulo}</td>
                        <td>{item.articulo}</td>
                        <td>
                          <div className="d-flex flex-wrap align-items-center justify-content-center">
                            <button
                              className="btn btn-sm btn-outline-secondary me-1 mb-1"
                              onClick={() =>
                                actualizarProducto(item.id, {
                                  cantidad: item.cantidad > 1 ? item.cantidad - 1 : 1,
                                })
                              }
                              disabled={item.cantidad <= 1}
                            >
                              –
                            </button>
                            <input
                              type="number"
                              min="1"
                              className="form-control form-control-sm text-center mb-1 input-cantidad"
                              style={{ width: '70px' }}
                              value={item.cantidad === 0 ? "" : item.cantidad}
                              onChange={(e) => {
                                const valor = e.target.value;

                                // Permite el valor vacío momentáneamente
                                if (valor === "") {
                                  actualizarProducto(item.id, { cantidad: 0 });
                                  return;
                                }

                                const numero = parseInt(valor);
                                if (!isNaN(numero) && numero >= 1) {
                                  actualizarProducto(item.id, { cantidad: numero });
                                }
                              }}
                              onBlur={(e) => {
                                const valor = parseInt(e.target.value);
                                actualizarProducto(item.id, {
                                  cantidad: isNaN(valor) || valor < 1 ? 1 : valor
                                });
                              }}
                            />
                            <button
                              className="btn btn-sm btn-outline-secondary ms-1 mb-1"
                              onClick={() =>
                                actualizarProducto(item.id, {
                                  cantidad: item.cantidad + 1,
                                })
                              }
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
                            onChange={(e) =>
                              actualizarProducto(item.id, {
                                observacion: e.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap justify-content-center">
                            <button className="btn btn-sm btn-info">Ver Imagen</button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                if (window.confirm(`¿Eliminar "${item.articulo}" del pedido?`)) {
                                  eliminarProducto(item.id);
                                }
                              }}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* Observación General */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Observación General</h5>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Agregá instrucciones, comentarios o notas para este pedido..."
              value={observacionGeneral}
              onChange={(e) => guardarObservacionGeneral(e.target.value)}
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          {/* Deshacer */}
          <div>
            {/* ✅ CORRECCIÓN 3: Botón deshacer corregido */}
            <button
              className="btn btn-outline-danger fw-semibold px-3 py-2"
              onClick={() => {
                if (window.confirm("¿Deshacer todo el pedido?")) {
                  // Usar las funciones que ya tienes disponibles
                  pedido.forEach(item => eliminarProducto(item.id));
                  guardarObservacionGeneral('');
                }
              }}
            >
              ❌ Deshacer
            </button>
          </div>
          {/* Guardar y Enviar */}
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-primary fw-semibold px-3 py-2"
              onClick={() => console.log('Guardar pedido')}
            >
              💾 Guardar
            </button>
            <button
              className="btn btn-outline-success fw-semibold px-3 py-2"
              onClick={() => console.log('Enviar pedido')}
            >
              📤 Enviar
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="card shadow-sm mt-4">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-12 col-md-6">
                <div className="text-center text-md-start">
                  <p className="text-muted mb-1">Total de productos:</p>
                  <h3 className="text-success fw-bold mb-0">{totalProductos}</h3>
                </div>
              </div>
              <div className="col-12 col-md-6 mt-3 mt-md-0">
                <div className="text-center text-md-end">
                  <button
                    className="btn btn-warning btn-lg px-4 fw-semibold"
                    onClick={enviarPedido}
                  >
                    <span className="me-2">🛒</span>
                    Finalizar Pedido
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación inferior */}
      <nav className="fixed-bottom mb-4 bg-transparent">
        <div className="d-flex justify-content-around align-items-center">
          <button className="btn btn-success d-flex align-items-center gap-2 px-4 py-2 shadow rounded-pill">
            🔍 <span className="fw-semibold text-white">Catálogo</span>
          </button>
          <button className="btn btn-success d-flex align-items-center gap-2 px-4 py-2 shadow rounded-pill">
            ➕ <span className="fw-semibold text-white">Pedido</span>
          </button>
          <button className="btn btn-success d-flex align-items-center gap-2 px-4 py-2 shadow rounded-pill">
            📄 <span className="fw-semibold text-white">Órdenes</span>
          </button>
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