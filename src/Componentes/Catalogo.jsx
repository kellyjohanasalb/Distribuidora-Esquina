import React, { useState, useEffect, useRef, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css'; // Importa estilos globales

const Catalogo = () => {
    const [productos, setProductos] = useState([]);
    const [rubros, setRubros] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [filtroRubro, setFiltroRubro] = useState('');
    const [visibleCount, setVisibleCount] = useState(6);
    const observerRef = useRef();

    const IMAGEN_POR_DEFECTO = '/imagenes/placeholder.png';

    useEffect(() => {
        const rubrosMock = ['Aseo', 'Papelería', 'Farmacia'];

        const productosMock = [
            { id: 1, nombre: 'Papel Higiénico', precio: 4200, rubro: 'Aseo', imagen: '/imagenes/papel higienicojpeg.png' },
            { id: 2, nombre: 'Shampoo Anticaspa', precio: 8500, rubro: 'Aseo', imagen: '/imagenes/descarga-shampo.png' },
            { id: 3, nombre: 'Crema Dental Menta', precio: 3200, rubro: 'Aseo', imagen: '/imagenes/colinos.png' },
            { id: 4, nombre: 'Libreta Cuadro Grande', precio: 6800, rubro: 'Papelería', imagen: '/imagenes/libretas.png' },
            { id: 5, nombre: 'Jabón en Barra', precio: 2900, rubro: 'Aseo', imagen: '/imagenes/JABPN PAN.png' },
            { id: 6, nombre: 'Acetaminofén 500mg', precio: 2500, rubro: 'Farmacia', imagen: '/imagenes/adetaminofen.jpg' },
            { id: 7, nombre: 'Cepillo Duro', precio: 3100, rubro: 'Aseo', imagen: '/imagenes/CEPILLO.png' },
            { id: 8, nombre: 'Toalla Facial', precio: 7900, rubro: 'Aseo', imagen: '/imagenes/TOALLA.png' },
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

    const productosFiltrados = productos
        .filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
        .filter((p) => (filtroRubro ? p.rubro === filtroRubro : true));

    return (
        <>
            <header className="bg-warning py-4 shadow-sm w-100">
                <div className="container">
                    <div className="row align-items-center g-3">
                        {/* Logo */}
                        <div className="col-12 col-md-3 text-center text-md-start">
                            <img
                                src="/logo-distruidora/logo-esquina.png"
                                alt="Distribuidora Esquina"
                                className="logo-img"
                            />

                        </div>

                        {/* Título */}
                        <div className="col-12 col-md-3 text-center">
                            <h1 className="text-success fw-bold fs-4 m-0">Catálogo</h1>
                        </div>

                        {/* Buscador */}
                        <div className="col-12 col-md-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="🔍 Buscar productos"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>

                        {/* Filtro por rubro */}
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

            <div className="container">
                {/* Catálogo */}
                <div className="row">
                    {productosFiltrados.slice(0, visibleCount).map((producto, idx) => {
                        const isLast = idx === Math.min(productosFiltrados.length, visibleCount) - 1;
                        return (
                            <div
                                key={producto.id}
                                ref={isLast ? observer : null}
                                className="col-md-6 mb-4"
                            >
                                <div className="card h-100 catalogo-card">
                                    <img
                                        src={producto.imagen || IMAGEN_POR_DEFECTO}
                                        alt={producto.nombre}
                                        className="catalogo-img"
                                    />
                                    <div className="card-body d-flex flex-column justify-content-center text-center p-3">
                                        <h5 className="card-title fw-semibold">{producto.nombre}</h5>
                                        <p className="card-text text-success fs-5 fw-bold">
                                            ${producto.precio.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {productosFiltrados.length === 0 && (
                    <p className="text-center text-muted">No se encontraron productos.</p>
                )}
            </div>
        </>
    );
};

export default Catalogo;