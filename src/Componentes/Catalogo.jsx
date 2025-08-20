// src/Pages/Catalogo.jsx
import 'bootstrap/dist/css/bootstrap.min.css';
import useCatalogo from '../Hooks/useCatalogo.js';
import  useConexion  from '../Hooks/useConexion.js';
import Select from 'react-select';
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
                <h1 className="text-success fw-bold fs-5 m-0">Distribuidora Esquina</h1>
                <small className={`fw-bold ${online ? 'text-success' : 'text-danger'}`}>
                  {online ? "🟢 En línea" : "🔴 Offline"}
                  {/* {catalogoCompleto && <span className="text-muted ms-2">(Catálogo completo)</span>} */}
                </small>
              </div>
            </div>

            {/* Buscador y filtros */}
            <div className="col-12 col-md-8">
              <div className="d-flex gap-2 flex-wrap justify-content-md-end justify-content-center">
                {/* Buscador */}
                <div style={{ minWidth: '160px', maxWidth: '240px' }}>
                  <Select
                    options={opcionesProductos}
                    onInputChange={(inputValue) => {
                      handleBusquedaChange({ target: { value: inputValue } });
                    }}
                    onChange={handleBuscarSeleccion}
                    value={busqueda ? { value: '', label: busqueda } : null}
                    placeholder="🔍 Buscar productos"
                    classNamePrefix="react-select"
                    isClearable
                    isSearchable
                    noOptionsMessage={() => busqueda.length < 2 ? "Escriba al menos 2 caracteres" : "No se encontraron productos"}
                    loadingMessage={() => "Buscando..."}
                    filterOption={null}
                    menuIsOpen={busqueda.length >= 2 && sugerencias.length > 0 ? undefined : false}
                  />
                </div>

                {/* Filtro por rubro */}
                <div style={{ minWidth: '160px', maxWidth: '240px' }}>
                  <Select
                    options={[{ value: '', label: 'Todos los rubros' }, ...opcionesRubros]}
                    onChange={(selected) => handleRubroChange({ target: { value: selected?.value || '' } })}
                    value={
                      opcionesRubros.find(o => o.value === filtroRubro) || {
                        value: '',
                        label: 'Todos los rubros',
                      }
                    }
                    placeholder="🎯 Filtrar por rubro"
                    classNamePrefix="react-select"
                    isSearchable={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Título y filtros activos */}
      <section className="container my-3">
        <div className="d-flex justify-content-between align-items-center px-2">
          <h2 className="text-success fw-bold fs-2 m-0">Catálogo</h2>
          <span className="text-muted small">
            {nombreRubro} ({productos.length} producto{productos.length !== 1 ? 's' : ''})
          </span>
        </div>
        
        {(busqueda || filtroRubro) && (
          <div className="mt-2 px-2 d-flex justify-content-between align-items-center">
            <small className="text-muted">
              {busqueda && `Buscando: "${busqueda}"`}
              {busqueda && filtroRubro && ' • '}
              {filtroRubro && `Rubro: ${nombreRubro}`}
            </small>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={reiniciarFiltros}
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </section>

      {/* MAIN */}
      <main className="container my-3">
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
            <p>Use el buscador o seleccione un rubro para ver los productos.</p>
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
            <button 
              className="btn btn-link text-success"
              onClick={reiniciarFiltros}
            >
              Mostrar todos los productos
            </button>
          </div>
        ) : (
          Object.entries(productosPorRubro).map(([rubro, productosDelRubro]) => (
            <div key={rubro} className="mb-5">
              {/* Nombre de rubro */}
              <div className="row mb-3">
                <div className="col-12">
                  <div className="border-bottom pb-2 mb-2">
                    <h5 className="mb-0 fw-semibold text-success d-flex align-items-center">
                      <span>{rubro}</span>
                      <span className="badge bg-light text-dark ms-2">
                        {productosDelRubro.length} producto{productosDelRubro.length !== 1 ? 's' : ''}
                      </span>
                    </h5>
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div className="row">
                {productosDelRubro.map((producto) => (
                  <div key={producto.idArticulo} className="col-12 col-sm-6 col-md-4 mb-4">
                    <div className="card h-100 catalogo-card">
                      <img
                        src={producto.imagen || IMAGEN_POR_DEFECTO}
                        alt={producto.descripcion}
                        className="card-img-top catalogo-img"
                      />
                      <div className="card-body text-center">
                        <h5 className="card-title fw-bold">{producto.descripcion}</h5>
                        {producto.detalle1 && (
                          <p className="card-subtitle text-muted small">{producto.detalle1}</p>
                        )}
                        <p className="card-text fs-5 text-dark">
                          ${formatearPrecio(producto.precioVenta)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {hasNextPage && !catalogoCompleto && (
          <div className="col-12 text-center mt-4">
            <button
              onClick={() => fetchProductos()}
              className="btn btn-success"
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
    </>
  );
};

export default Catalogo;