import 'bootstrap/dist/css/bootstrap.min.css';
import useCatalogo from '../Hooks/useCatalogo.js';
import useConexion from '../Hooks/useConexion.js';
import Select from 'react-select';
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

  const IMAGEN_POR_DEFECTO =
    'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

  // Colores para cada categoría
  const coloresCategoria = {
    'Bebidas': '#E74C3C',
    'Alimentos': '#F39C12',
    'Lácteos': '#3498DB',
    'Carnes': '#27AE60',
    'Limpieza': '#9B59B6',
    'Panadería': '#F1C40F',
    'Frutas y Verduras': '#2ECC71',
    'Otros': '#95A5A6'
  };

  // Opciones del buscador - restauradas de la versión original
  const opcionesProductos = sugerencias.length > 0
    ? sugerencias
    : productos.slice(0, 10).map(p => ({
        value: p.idArticulo,
        label: p.descripcion,
      }));

  // Agrupar productos por rubro
  const productosPorRubro = {};
  productos.forEach((producto) => {
    const nombre = rubros.find((r) => r.id === producto.idRubro)?.descripcion || 'Otros';
    if (!productosPorRubro[nombre]) productosPorRubro[nombre] = [];
    productosPorRubro[nombre].push(producto);
  });

  // Estados de visualización
  const mostrarCargando = isLoading && productos.length === 0;
  const mostrarSinResultados =
    !isLoading && productos.length === 0 && (busqueda.trim().length >= 2 || filtroRubro);
  const mostrarMensajeInicial =
    !isLoading && productos.length === 0 && busqueda.trim().length < 2 && !filtroRubro;
  const mostrarCarrusel = !mostrarCargando && !filtroRubro && !busqueda.trim();

  // Manejo de selección en buscador - restaurado
  const handleBuscarSeleccion = (selected) => {
    if (selected) {
      seleccionarSugerencia(selected);
    } else {
      handleBusquedaChange({ target: { value: '' } });
    }
  };

  const rubroActivo = rubros.find((r) => r.id.toString() === filtroRubro);
  const nombreRubro = rubroActivo?.descripcion || 'Todos los productos';

  // Formato de precios
  const formatearPrecio = (precio) => {
    const numero = parseFloat(precio);
    return isNaN(numero) ? '0,00' : numero.toFixed(2).replace('.', ',');
  };

  return (
    <>
      {/* HEADER */}
      <header className="bg-yellow shadow-sm w-150 border-bottom">
        <div className="container">
          <div className="row align-items-center g-5 py-2">
            {/* Logo y título */}
            <div className="col-12 col-md-4 d-flex align-items-center gap-3 justify-content-md-start justify-content-center">
              <Link to="/pedido">
                <img
                  src="/logo-distruidora/logo.png"
                  alt="Distribuidora Esquina"
                  className="logo-img"
                  onError={(e) => {
                    e.target.src = IMAGEN_POR_DEFECTO;
                  }}
                  style={{ cursor: 'pointer', maxHeight: '1050px' }}
                />
              </Link>
              <div>
                <h1 className="text-success fw-bold fs-3 m-0" style={{ whiteSpace: 'nowrap' }}>Distribuidora Esquina</h1>
                <small className={`fw-bold ${online ? 'text-success' : 'text-danger'}`}>
                  {online ? '🟢 En línea' : '🔴 Offline'}
                </small>
              </div>
            </div>

            {/* Buscador - RESTAURADO con Select */}
            <div className="col-12 col-md-8">
              <div className="d-flex justify-content-md-end justify-content-center">
                <div style={{ width: '100%', maxWidth: '400px' }}>
                  <Select
                    options={opcionesProductos}
                    onInputChange={(inputValue) => {
                      handleBusquedaChange({ target: { value: inputValue } });
                    }}
                    onChange={handleBuscarSeleccion}
                    value={busqueda ? { value: '', label: busqueda } : null}
                    placeholder="¿Qué producto buscas?"
                    classNamePrefix="react-select"
                    isClearable
                    isSearchable
                    noOptionsMessage={() => busqueda.length < 2 ? "Escriba al menos 2 caracteres" : "No se encontraron productos"}
                    loadingMessage={() => "Buscando..."}
                    filterOption={null}
                    menuIsOpen={busqueda.length >= 2 && sugerencias.length > 0 ? undefined : false}
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        borderRadius: '25px',
                        paddingLeft: '10px',
                        fontSize: '16px',
                        border: '2px solid #ddd',
                        minHeight: '48px'
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        color: '#999'
                      })
                    }}
                  />
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
          {/* SIDEBAR - CATEGORÍAS - Solo visible en pantallas grandes */}
          <div className="col-lg-3 d-none d-lg-block">
            <div className="card shadow-sm" style={{ position: 'sticky', top: '20px', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
              <div className="card-header bg-light">
                <h5 className="mb-0 fw-bold">CATEGORÍAS</h5>
              </div>
              <div className="list-group list-group-flush">
                <button
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                    !filtroRubro ? 'active' : ''
                  }`}
                  onClick={() => handleRubroChange({ target: { value: '' } })}
                >
                  <span>Todos los productos</span>
                  <span className="badge bg-secondary rounded-pill">{productos.length}</span>
                </button>
                {rubros.map((rubro) => {
                  const productosEnRubro = productos.filter((p) => p.idRubro === rubro.id).length;
                  const colorCategoria = coloresCategoria[rubro.descripcion] || coloresCategoria['Otros'];

                  return (
                    <button
                      key={rubro.id}
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                        filtroRubro === rubro.id.toString() ? 'active' : ''
                      }`}
                      onClick={() => handleRubroChange({ target: { value: rubro.id.toString() } })}
                      style={{
                        borderLeft:
                          filtroRubro === rubro.id.toString()
                            ? `4px solid ${colorCategoria}`
                            : `4px solid transparent`
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

              {/* Filtros activos - AHORA DENTRO DEL CARD DE CATEGORÍAS */}
              {(busqueda || filtroRubro) && (
                <div className="card-footer bg-light">
                  <h6 className="card-title mb-2">Filtros activos</h6>
                  {busqueda && (
                    <div className="mb-2">
                      <span className="badge bg-primary me-2 d-inline-flex align-items-center">
                        Búsqueda: "{busqueda}"
                        <button 
                          type="button" 
                          className="btn-close btn-close-white ms-2" 
                          style={{ fontSize: '0.6rem' }}
                          onClick={() => handleBusquedaChange({ target: { value: '' } })}
                          aria-label="Eliminar filtro de búsqueda"
                        ></button>
                      </span>
                    </div>
                  )}
                  {filtroRubro && (
                    <div className="mb-2">
                      <span className="badge bg-info me-2 d-inline-flex align-items-center">
                        Categoría: {nombreRubro}
                        <button 
                          type="button" 
                          className="btn-close btn-close-white ms-2" 
                          style={{ fontSize: '0.6rem' }}
                          onClick={() => handleRubroChange({ target: { value: '' } })}
                          aria-label="Eliminar filtro de categoría"
                        ></button>
                      </span>
                    </div>
                  )}
                  <button className="btn btn-sm btn-outline-secondary w-100 mt-2" onClick={reiniciarFiltros}>
                    Limpiar todos los filtros
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* FILTROS MÓVILES - Solo visible en pantallas pequeñas */}
          <div className="d-lg-none mb-3">
            <div className="container">
              {/* Categorías en móvil */}
              <div className="row mb-3">
                <div className="col-12">
                  <div className="d-flex gap-2 overflow-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                    <button
                      className={`btn ${!filtroRubro ? 'btn-success' : 'btn-outline-success'} flex-shrink-0`}
                      onClick={() => handleRubroChange({ target: { value: '' } })}
                    >
                      Todos ({productos.length})
                    </button>
                    {rubros.map((rubro) => {
                      const productosEnRubro = productos.filter((p) => p.idRubro === rubro.id).length;
                      const colorCategoria = coloresCategoria[rubro.descripcion] || coloresCategoria['Otros'];
                      const isActive = filtroRubro === rubro.id.toString();

                      return (
                        <button
                          key={rubro.id}
                          className={`btn flex-shrink-0 ${isActive ? 'text-white' : 'btn-outline-secondary'}`}
                          style={{
                            backgroundColor: isActive ? colorCategoria : 'transparent',
                            borderColor: colorCategoria,
                            color: isActive ? 'white' : colorCategoria
                          }}
                          onClick={() => handleRubroChange({ target: { value: rubro.id.toString() } })}
                        >
                          {rubro.descripcion} ({productosEnRubro})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Filtros activos móvil */}
              {(busqueda || filtroRubro) && (
                <div className="row mb-3">
                  <div className="col-12">
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      <small className="text-muted me-2">Filtros:</small>
                      {busqueda && (
                        <span className="badge bg-primary">
                          Búsqueda: "{busqueda}"
                          <button 
                            type="button" 
                            className="btn-close btn-close-white ms-2" 
                            style={{ fontSize: '0.6rem' }}
                            onClick={() => handleBusquedaChange({ target: { value: '' } })}
                          ></button>
                        </span>
                      )}
                      {filtroRubro && (
                        <span className="badge bg-info">
                          {nombreRubro}
                          <button 
                            type="button" 
                            className="btn-close btn-close-white ms-2" 
                            style={{ fontSize: '0.6rem' }}
                            onClick={() => handleRubroChange({ target: { value: '' } })}
                          ></button>
                        </span>
                      )}
                      <button className="btn btn-sm btn-outline-secondary" onClick={reiniciarFiltros}>
                        Limpiar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CONTENIDO PRINCIPAL */}
          <div className="col-lg-9 col-12">
            {/* Título y contador */}
            <div className="d-flex justify-content-between align-items-center mb-3 px-3 px-lg-0">
              <h2 className="text-success fw-bold m-0">
                {filtroRubro ? nombreRubro : 'Catálogo'}
              </h2>
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
                  <p>Use el buscador o seleccione una categoría para ver los productos.</p>
                  <small>Escriba al menos 2 caracteres para buscar productos</small>
                </div>
              ) : mostrarSinResultados ? (
                <div className="text-center text-muted py-5">
                  <h5>No se encontraron resultados</h5>
                  {busqueda && busqueda.length < 2 && (
                    <p>Escriba al menos 2 caracteres para buscar productos.</p>
                  )}
                  {busqueda && busqueda.length >= 2 && (
                    <p>Intenta con otros términos de búsqueda o verifica la ortografía.</p>
                  )}
                  <button className="btn btn-link text-success" onClick={reiniciarFiltros}>
                    Mostrar todos los productos
                  </button>
                </div>
              ) : (
                Object.entries(productosPorRubro).map(([rubro, productosDelRubro]) => {
                  const colorCategoria = coloresCategoria[rubro] || coloresCategoria['Otros'];

                  return (
                    <div key={rubro} className="mb-5">
                      {/* Mostrar título de rubro solo cuando no hay filtro específico */}
                      {(!filtroRubro || Object.keys(productosPorRubro).length > 1) && (
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="mb-0 fw-semibold d-flex align-items-center" style={{ color: colorCategoria }}>
                            <span>{rubro}</span>
                          </h5>
                          <span className="badge text-white" style={{ backgroundColor: colorCategoria }}>
                            {productosDelRubro.length} producto{productosDelRubro.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {/* Productos */}
                      <div className="row">
                        {productosDelRubro.map((producto) => (
                          <div
                            key={producto.idArticulo}
                            className="col-12 col-sm-6 col-lg-4 col-xl-3 mb-4"
                          >
                            <div className="card h-100 catalogo-card shadow-sm border-0">
                              <img
                                src={producto.imagen || IMAGEN_POR_DEFECTO}
                                alt={producto.descripcion}
                                className="card-img-top"
                                style={{
                                  height: '180px',
                                  objectFit: 'cover',
                                  borderRadius: '8px 8px 0 0'
                                }}
                                onError={(e) => {
                                  e.target.src = IMAGEN_POR_DEFECTO;
                                }}
                              />
                              <div className="card-body text-center d-flex flex-column">
                                <h6 className="card-title fw-bold mb-2" style={{ fontSize: '0.95rem' }}>
                                  {producto.descripcion}
                                </h6>
                                {producto.detalle1 && (
                                  <p className="card-subtitle text-muted small mb-2">{producto.detalle1}</p>
                                )}
                                <div className="mt-auto">
                                  <p
                                    className="card-text fw-bold mb-0"
                                    style={{ fontSize: '1.1rem', color: colorCategoria }}
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
                    ) : (
                      'Ver más productos'
                    )}
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