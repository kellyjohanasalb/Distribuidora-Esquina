/* eslint-disable no-unused-vars */
import 'bootstrap/dist/css/bootstrap.min.css';
import useCatalogo from '../Hooks/useCatalogo.js';
import  useConexion  from '../Hooks/useConexion.js';
import CarruselProductos from './CarruselProdcutos.jsx';
import { Link } from 'react-router-dom';
import '../index.css';

const Catalogo = () => {
  const {
    productos,
    rubros,
    busqueda,
    filtroRubro,
    sugerencias,
    handleBusquedaChange,
    handleRubroChange,
    seleccionarSugerencia,
    fetchProductos,
    hasNextPage,
    isLoading,
    reiniciarFiltros,
    catalogoCompleto
  } = useCatalogo();

  const online = useConexion();

  const IMAGEN_POR_DEFECTO = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

  // Colores para cada categoría basados en el logo
  const coloresCategoria = {
    'Bebidas': '#E74C3C',        // Rojo
    'Alimentos': '#F39C12',      // Naranja
    'Lácteos': '#3498DB',        // Azul
    'Carnes': '#27AE60',         // Verde
    'Limpieza': '#9B59B6',       // Morado
    'Panadería': '#F1C40F',      // Amarillo
    'Frutas y Verduras': '#2ECC71', // Verde claro
    'Otros': '#95A5A6'           // Gris
  };



  // Opciones del buscador - mejoradas
  const opcionesProductos = sugerencias.length > 0
    ? sugerencias
    : productos.slice(0, 10).map(p => ({
        value: p.idArticulo,
        label: p.descripcion,
      }));

  const opcionesRubros = rubros.map(r => ({
    value: r.id.toString(),
    label: r.descripcion,
  }));

  const rubroActivo = rubros.find(r => r.id.toString() === filtroRubro);
  const nombreRubro = rubroActivo?.descripcion || 'Todos los productos';

  // Formatear precios
  const formatearPrecio = (precio) => {
    const numero = parseFloat(precio);
    return isNaN(numero) ? '0,00' : numero.toFixed(2).replace('.', ',');
  };

  // Agrupar por rubro
  const productosPorRubro = {};
  productos.forEach(producto => {
    const nombre = rubros.find(r => r.id === producto.idRubro)?.descripcion || 'Otros';
    if (!productosPorRubro[nombre]) productosPorRubro[nombre] = [];
    productosPorRubro[nombre].push(producto);
  });

  // Condiciones mejoradas para mostrar estado
  const mostrarCargando = isLoading && productos.length === 0;
  const mostrarSinResultados = !isLoading && productos.length === 0 && (busqueda.trim().length >= 2 || filtroRubro);
  const mostrarMensajeInicial = !isLoading && productos.length === 0 && busqueda.trim().length < 2 && !filtroRubro;
 const mostrarCarrusel = !mostrarCargando && productos.length > 0;
  
  // Manejo de selección en buscador
  const handleBuscarSeleccion = (selected) => {
    if (selected) {
      seleccionarSugerencia(selected);
    } else {
      handleBusquedaChange({ target: { value: '' } });
    }
  };

  return (
    <>
      {/* HEADER */}
      <header className="bg-custom-header shadow-sm w-100">
        <div className="container">
          <div className="row align-items-center g-3 py-2">
            {/* Logo y título */}
            <div className="col-12 col-md-4 d-flex align-items-center gap-3 justify-content-md-start justify-content-center">
              <Link to="/pedido">
                <img
                  src="/logo-distruidora/logo.png"
                  alt="Distribuidora Esquina"
                  className="logo-img"
                  onError={(e) => { e.target.src = IMAGEN_POR_DEFECTO; }}
                  style={{ cursor: 'pointer' }}
                />
              </Link>
              <div>
                <h1 className="text-success fw-bold fs-1 m-0">Catálogo</h1>
                <small className={`fw-bold ${online ? 'text-success' : 'text-danger'}`}>
                  {online ? "🟢 En línea" : "🔴 Offline"}
                </small>
              </div>
            </div>

            {/* Buscador */}
            <div className="col-12 col-md-8">
              <div className="d-flex justify-content-md-end justify-content-center">
                <div style={{ width: '100%', maxWidth: '400px' }}>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="¿Qué producto buscas?"
                      value={busqueda}
                      onChange={handleBusquedaChange}
                      style={{
                        borderRadius: '25px',
                        paddingLeft: '20px',
                        paddingRight: '50px',
                        fontSize: '16px',
                        border: '2px solid #ddd'
                      }}
                    />
                    <div 
                      className="position-absolute"
                      style={{ 
                        right: '15px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        color: '#999'
                      }}
                    >
                      🔍
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CARRUSEL DE PRODUCTOS NUEVOS */}
    {mostrarCarrusel && <CarruselProductos />}

      {/* CONTENIDO PRINCIPAL CON SIDEBAR */}
      <div className="container-fluid my-3">
        <div className="row">
          {/* SIDEBAR - CATEGORÍAS */}
          <div className="col-lg-3 col-md-4 mb-4">
            <div className="card shadow-sm">
              <div className="card-header bg-light">
                <h5 className="mb-0 fw-bold">CATEGORÍAS</h5>
              </div>
              <div className="list-group list-group-flush">
                <button
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${!filtroRubro ? 'active' : ''}`}
                  onClick={() => handleRubroChange({ target: { value: '' } })}
                >
                  <span>Todos los productos</span>
                  <span className="badge bg-secondary rounded-pill">{productos.length}</span>
                </button>
                {rubros.map((rubro) => {
                  const productosEnRubro = productos.filter(p => p.idRubro === rubro.id).length;
                  const colorCategoria = coloresCategoria[rubro.descripcion] || coloresCategoria['Otros'];
                  
                  return (
                    <button
                      key={rubro.id}
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                        filtroRubro === rubro.id.toString() ? 'active' : ''
                      }`}
                      onClick={() => handleRubroChange({ target: { value: rubro.id.toString() } })}
                      style={{
                        borderLeft: filtroRubro === rubro.id.toString() ? `4px solid ${colorCategoria}` : `4px solid transparent`
                      }}
                    >
                      <span>{rubro.descripcion}</span>
                      <span 
                        className="badge rounded-pill text-white"
                        style={{ backgroundColor: colorCategoria }}
                      >
                        {productosEnRubro}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtros activos */}
            {(busqueda || filtroRubro) && (
              <div className="card mt-3 shadow-sm">
                <div className="card-body">
                  <h6 className="card-title">Filtros activos</h6>
                  {busqueda && (
                    <div className="mb-2">
                      <span className="badge bg-primary me-2">Búsqueda: {busqueda}</span>
                    </div>
                  )}
                  {filtroRubro && (
                    <div className="mb-2">
                      <span className="badge bg-info me-2">Categoría: {nombreRubro}</span>
                    </div>
                  )}
                  <button 
                    className="btn btn-sm btn-outline-secondary w-100"
                    onClick={reiniciarFiltros}
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CONTENIDO PRINCIPAL */}
          <div className="col-lg-9 col-md-8">
            {/* Título y contador */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="text-success fw-bold m-0">{nombreRubro}</h2>
              <span className="text-muted">
                {productos.length} producto{productos.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* MAIN CONTENT */}
            <main>
              {mostrarCargando ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando catálogo...</p>
                </div>
              ) : mostrarMensajeInicial ? (
                <div className="text-center text-muted py-5">
                  <h5>Bienvenido al catálogo</h5>
                  <p>Seleccione una categoría para ver los productos.</p>
                </div>
              ) : mostrarSinResultados ? (
                <div className="text-center text-muted py-5">
                  <h5>No se encontraron resultados</h5>
                  <p>Intenta con otros términos de búsqueda o selecciona una categoría diferente.</p>
                  <button 
                    className="btn btn-link text-success"
                    onClick={reiniciarFiltros}
                  >
                    Mostrar todos los productos
                  </button>
                </div>
              ) : (
                Object.entries(productosPorRubro).map(([rubro, productosDelRubro]) => {
                  const colorCategoria = coloresCategoria[rubro] || coloresCategoria['Otros'];
                  
                  return (
                    <div key={rubro} className="mb-5">
                      {/* Solo mostrar título de rubro si NO hay filtro de rubro activo o si es "Todos los productos" */}
                      {(!filtroRubro || !rubroActivo) && (
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 
                            className="mb-0 fw-semibold d-flex align-items-center"
                            style={{ color: colorCategoria }}
                          >
                            <span>{rubro}</span>
                          </h5>
                          <span 
                            className="badge text-white"
                            style={{ backgroundColor: colorCategoria }}
                          >
                            {productosDelRubro.length} producto{productosDelRubro.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {/* Productos */}
                      <div className="row">
                        {productosDelRubro.map((producto) => (
                          <div key={producto.idArticulo} className="col-12 col-sm-6 col-lg-4 col-xl-3 mb-4">
                            <div className="card h-100 catalogo-card shadow-sm">
                              <img
                                src={producto.imagen || IMAGEN_POR_DEFECTO}
                                alt={producto.descripcion}
                                className="card-img-top"
                                style={{
                                  height: '180px',
                                  objectFit: 'cover',
                                  borderRadius: '8px 8px 0 0'
                                }}
                              />
                              <div className="card-body text-center d-flex flex-column">
                                <h6 className="card-title fw-bold mb-2" style={{ fontSize: '0.95rem' }}>
                                  {producto.descripcion}
                                </h6>
                                {producto.detalle1 && (
                                  <p className="card-subtitle text-muted small mb-2">
                                    {producto.detalle1}
                                  </p>
                                )}
                                <div className="mt-auto">
                                  <p 
                                    className="card-text fw-bold mb-0"
                                    style={{ 
                                      fontSize: '1.1rem',
                                      color: colorCategoria
                                    }}
                                  >
                                    ${formatearPrecio(producto.precioVenta)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}

              {hasNextPage && !catalogoCompleto && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => fetchProductos()}
                    className="btn btn-success btn-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Cargando...
                      </>
                    ) : 'Ver más productos'}
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Catalogo;