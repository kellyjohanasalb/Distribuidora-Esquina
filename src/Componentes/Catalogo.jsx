import 'bootstrap/dist/css/bootstrap.min.css';
import useCatalogo from '../Hooks/useCatalogo.js';
import Select from 'react-select';
import '../index.css';

const Catalogo = () => {
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

  const IMAGEN_POR_DEFECTO = 'https://via.placeholder.com/150';

  const opcionesProductos = productos.map(p => ({
    value: p.idArticulo,
    label: p.descripcion,
  }));

  const opcionesRubros = rubros.map(r => ({
    value: r.id.toString(),
    label: r.descripcion,
  }));

  const rubroActivo = rubros.find(r => r.id.toString() === filtroRubro);
  const nombreRubro = rubroActivo?.descripcion || 'Todos los productos';

  const productosPorRubro = {};
  productos.forEach(producto => {
    const nombre = rubros.find(r => r.id === producto.idRubro)?.descripcion || 'Otros';
    if (!productosPorRubro[nombre]) {
      productosPorRubro[nombre] = [];
    }
    productosPorRubro[nombre].push(producto);
  });

  return (
    <>
      {/* Header principal compacto */}
      <header className="bg-custom-header shadow-sm w-100">
        <div className="container">
          <div className="row align-items-center g-3 py-2">
            <div className="col-12 col-md-4 d-flex align-items-center gap-3 justify-content-md-start justify-content-center">
              <img
                src="/logo-distruidora/logo.png"
                alt="Distribuidora Esquina"
                className="logo-img"
                onError={(e) => { e.target.src = IMAGEN_POR_DEFECTO; }}
              />
              <h1 className="text-success fw-bold fs-5 m-0">Distribuidora Esquina</h1>
            </div>

            <div className="col-12 col-md-8">
              <div className="d-flex gap-2 flex-wrap justify-content-md-end justify-content-center">
                <div style={{ minWidth: '160px', maxWidth: '240px' }}>
                  <Select
                    options={opcionesProductos}
                    onInputChange={(inputValue) =>
                      handleBusquedaChange({ target: { value: inputValue } })
                    }
                    onChange={(selected) =>
                      handleBusquedaChange({ target: { value: selected?.label || '' } })
                    }
                    value={busqueda ? { value: '', label: busqueda } : null}
                    placeholder="🔍 Buscar productos"
                    classNamePrefix="react-select"
                    isClearable
                  />
                </div>

                <div style={{ minWidth: '160px', maxWidth: '240px' }}>
                  <Select
                    options={[{ value: '', label: 'Todos los rubros' }, ...opcionesRubros]}
                    onChange={(selected) =>
                      handleRubroChange({ target: { value: selected?.value || '' } })
                    }
                    value={
                      opcionesRubros.find(o => o.value === filtroRubro) || {
                        value: '',
                        label: 'Todos los rubros',
                      }
                    }
                    placeholder="🎯 Filtrar por rubro"
                    classNamePrefix="react-select"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Catálogo título y contador */}
      <section className="container my-3">
        <div className="d-flex justify-content-between align-items-center px-2">
          <h2 className="text-success fw-bold fs-2 m-0">Catálogo</h2>
          <span className="text-muted small">
            {nombreRubro} ({productos.length})
          </span>
        </div>
      </section>

      {/* Productos agrupados por rubro */}
      <main className="container my-3">
        {Object.entries(productosPorRubro).map(([rubro, productosDelRubro]) => (
          <div key={rubro} className="mb-5">
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

            <div className="row">
              {productosDelRubro.map((producto) => (
                <div key={producto.idArticulo} className="col-12 col-sm-6 col-md-4 mb-4">
                  <div className="card h-100">
                    <img
                      src={producto.imagen || IMAGEN_POR_DEFECTO}
                      className="card-img-top"
                      alt={producto.descripcion}
                    />
                    <div className="card-body text-center">
                      <h5 className="card-title fw-bold">{producto.descripcion}</h5>
                      <p className="card-text fs-5 text-dark">${producto.precioVenta}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {hasNextPage && (
          <div className="col-12 text-center mt-4">
            <button
              onClick={() => fetchProductos()}
              className="btn btn-success"
              disabled={isLoading}
            >
              {isLoading ? 'Cargando...' : 'Ver más productos'}
            </button>
          </div>
        )}
      </main>
    </>
  );
};

export default Catalogo;