import React, { useState, useEffect, useRef, useCallback } from 'react';
/* import 'bootstrap/dist/css/bootstrap.min.css'; */
import '../index.css';

const Catalogo = () => {
  const [productos, setProductos] = useState([]);
  const [rubros, setRubros] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRubro, setFiltroRubro] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const observerRef = useRef(null);

  const IMAGEN_POR_DEFECTO = '/imagenes/placeholder.png';

  useEffect(() => {
    const rubrosMock = ['Aseo', 'Papelería', 'Farmacia'];

    const productosMock = [
      { id: 1, nombre: 'Papel Higiénico', precio: 4200, rubro: 'Aseo', imagen: '/imagenes/papel-higienico.png' },
      { id: 2, nombre: 'Shampoo Anticaspa', precio: 8500, rubro: 'Aseo', imagen: '/imagenes/shampo.png' },
      { id: 3, nombre: 'Crema Dental Menta', precio: 3200, rubro: 'Aseo', imagen: '/imagenes/colinos.png' },
      { id: 4, nombre: 'Libreta Cuadro Grande', precio: 6800, rubro: 'Papelería', imagen: '/imagenes/libretas.png' },
      { id: 5, nombre: 'Jabón en Barra', precio: 2900, rubro: 'Aseo', imagen: '/imagenes/Jabon-esencial.png' },
      { id: 6, nombre: 'Acetaminofén 500mg', precio: 2500, rubro: 'Farmacia', imagen: '/imagenes/acetaminofen.jpg' },
      { id: 7, nombre: 'Cepillo', precio: 3100, rubro: 'Aseo', imagen: '/imagenes/cepillo.png' },
      { id: 8, nombre: 'Toalla Facial', precio: 7900, rubro: 'Aseo', imagen: '/imagenes/toalla.png' },
      { id: 9, nombre: 'Brocha de Afeitar', precio: 5500, rubro: 'Aseo', imagen: '/imagenes/brocha-afeitar.png' },
      { id: 10, nombre: 'Jabón Corporal', precio: 2500, rubro: 'Aseo', imagen: '/imagenes/jabon-palmolive.png' }, // Corregido ID duplicado
    ];

    setRubros(rubrosMock);
    setProductos(productosMock);
  }, []);

  const observer = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setTimeout(() => setVisibleCount((prev) => prev + 2), 500);
      }
    });
    if (node) observerRef.current.observe(node);
  }, []);

  // Filtrar productos
  const productosFiltrados = productos
    .filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .filter((p) => (filtroRubro ? p.rubro === filtroRubro : true));

  // Agrupar productos por rubro
  const productosAgrupados = productosFiltrados.reduce((grupos, producto) => {
    const rubro = producto.rubro;
    if (!grupos[rubro]) {
      grupos[rubro] = [];
    }
    grupos[rubro].push(producto);
    return grupos;
  }, {});

  // Ordenar rubros alfabéticamente
  const rubrosOrdenados = Object.keys(productosAgrupados).sort();

  // Colores para cada rubro basados en el logo (verde principal y tonos neutros)
  const coloresRubro = {
    'Aseo': 'bg-success',        // Verde principal del logo
    'Papelería': 'bg-secondary', // Gris/neutro
    'Farmacia': 'bg-dark'        // Verde oscuro/negro
  };

  // Contar productos visibles por rubro
  let contadorVisible = 0;

  return (
    <>
      <header className="bg-warning py-4 shadow-sm w-100">
        <div className="container">
          <div className="row align-items-center g-3">

            <div className="col-12 col-md-3 text-center text-md-start">
              <img
                src="/logo-distruidora/logo.png"
                alt="Distribuidora Esquina"
                className="logo-img"
                onError={(e) => { e.target.src = IMAGEN_POR_DEFECTO; }}
              />
            </div>

            <div className="col-12 col-md-3 text-center">
              <h1 className="text-success fw-bold fs-4 m-0">Catálogo</h1>
            </div>

            <div className="col-12 col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Buscar productos"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-3">
              <select
                className="form-select"
                value={filtroRubro}
                onChange={(e) => setFiltroRubro(e.target.value)}
              >
                <option value="">Todos los rubros</option>
                {rubros.map((rubro) => (
                  <option key={rubro} value={rubro}>{rubro}</option>
                ))}
              </select>
            </div>

          </div>
        </div>
      </header>

      <div className="container mt-4">
        {rubrosOrdenados.length === 0 ? (
          <p className="text-center text-muted">No se encontraron productos.</p>
        ) : (
          rubrosOrdenados.map((rubro) => {
            const productosDelRubro = productosAgrupados[rubro];
            const productosVisibles = productosDelRubro.slice(0, Math.max(0, visibleCount - contadorVisible));
            contadorVisible += productosVisibles.length;

            if (productosVisibles.length === 0) return null;

            return (
              <div key={rubro} className="mb-5">
                {/* Encabezado del rubro */}
                <div className="row mb-3">
                  <div className="col-12">
                    <div className={`p-3 rounded-3 text-white ${coloresRubro[rubro] || 'bg-secondary'}`}>
                      <h2 className="mb-0 fw-bold">
                        {rubro}
                        <span className="badge bg-light text-dark ms-2">
                          {productosDelRubro.length} producto{productosDelRubro.length !== 1 ? 's' : ''}
                        </span>
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Productos del rubro */}
                <div className="row">
                  {productosVisibles.map((producto, idx) => {
                    const isLastInGroup = idx === productosVisibles.length - 1;
                    const isLastOverall = contadorVisible >= visibleCount;
                    
                    return (
                      <div
                        key={producto.id}
                        ref={isLastInGroup && isLastOverall ? observer : null}
                        className="col-md-6 mb-4"
                      >
                        <div className="card h-100 catalogo-card">
                          <img
                            src={producto.imagen || IMAGEN_POR_DEFECTO}
                            alt={producto.nombre}
                            className="catalogo-img"
                            onError={(e) => { e.target.src = IMAGEN_POR_DEFECTO; }}
                          />
                          <div className="card-body d-flex flex-column justify-content-center text-center p-3">
                            <h5 className="card-title fw-semibold">{producto.nombre}</h5>
                            <p className="card-text text-success fs-5 fw-bold">
                              ${producto.precio.toLocaleString()}
                            </p>
                            <small className={`badge ${coloresRubro[producto.rubro] || 'bg-secondary'} text-white`}>
                              {producto.rubro}
                            </small>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default Catalogo;