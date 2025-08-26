import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Sparkles } from 'lucide-react';

const CarruselProductos = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(3);

  const productosNuevos = [
    {
      id: 1,
      imagen: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=300&fit=crop",
      descripcion: "Aceite Girasol Premium 1.5L",
      detalle1: "Calidad superior para cocinar",
      precioVenta: "2450.00",
      esNuevo: true,
      descuento: "10%"
    },
    {
      id: 2,
      imagen: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop",
      descripcion: "Arroz Integral Premium 1kg",
      detalle1: "Rico en fibra y nutrientes",
      precioVenta: "1890.50",
      esNuevo: true,
      descuento: null
    },
    {
      id: 3,
      imagen: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop",
      descripcion: "Café Molido Premium 500g",
      detalle1: "Tostado artesanal",
      precioVenta: "3200.75",
      esNuevo: true,
      descuento: "15%"
    },
    {
      id: 4,
      imagen: "https://images.unsplash.com/photo-1574448857443-dc1d7e9c4dad?w=400&h=300&fit=crop",
      descripcion: "Miel Natural 750ml",
      detalle1: "Directa del productor",
      precioVenta: "2800.00",
      esNuevo: true,
      descuento: null
    },
    {
      id: 5,
      imagen: "https://images.unsplash.com/photo-1628518254107-11c9dc78cbf6?w=400&h=300&fit=crop",
      descripcion: "Pasta Italiana 500g",
      detalle1: "Elaboración tradicional",
      precioVenta: "980.25",
      esNuevo: true,
      descuento: "8%"
    },
    {
      id: 6,
      imagen: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&h=300&fit=crop",
      descripcion: "Quinoa Orgánica 500g",
      detalle1: "Súper alimento andino",
      precioVenta: "1650.00",
      esNuevo: true,
      descuento: null
    }
  ];

  const IMAGEN_POR_DEFECTO = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

  // Responsive: ajustar items según pantalla
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setItemsToShow(3); // Desktop: 3 items
      } else if (window.innerWidth >= 768) {
        setItemsToShow(2); // Tablet: 2 items
      } else {
        setItemsToShow(1); // Mobile: 1 item
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-play del carrusel - SIEMPRE ACTIVO
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => {
        const maxSlides = Math.max(0, productosNuevos.length - itemsToShow);
        return prev >= maxSlides ? 0 : prev + 1;
      });
    }, 4000); // 4 segundos

    return () => clearInterval(interval);
  }, [productosNuevos.length, itemsToShow]);

  const formatearPrecio = (precio) => {
    const numero = parseFloat(precio);
    return isNaN(numero) ? '0,00' : numero.toFixed(2).replace('.', ',');
  };

  const nextSlide = () => {
    const maxSlides = Math.max(0, productosNuevos.length - itemsToShow);
    setCurrentSlide(prev => prev >= maxSlides ? 0 : prev + 1);
  };

  const prevSlide = () => {
    const maxSlides = Math.max(0, productosNuevos.length - itemsToShow);
    setCurrentSlide(prev => prev <= 0 ? maxSlides : prev - 1);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  if (productosNuevos.length === 0) return null;

  const maxSlides = Math.max(0, productosNuevos.length - itemsToShow);
  const translateX = -(currentSlide * (100 / itemsToShow));

  return (
    <div className="py-4 mb-3" style={{ backgroundColor: '#f7dc6f' }}>
      <div className="container">
        {/* Título de la sección */}
        <div className="text-center mb-4">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <Sparkles className="text-success" size={20} />
            <h3 className="text-success fw-bold m-0">Productos Nuevos</h3>
            <Sparkles className="text-success" size={20} />
          </div>
          <p className="text-muted small">Descubre nuestras últimas incorporaciones</p>
        </div>

        {/* Carrusel */}
        <div className="position-relative" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div 
            className="overflow-hidden" 
            style={{ 
              borderRadius: '12px',
              backgroundColor: 'transparent', /* Fondo transparente */
              padding: '20px'
            }}
          >
            <div 
              className="d-flex"
              style={{
                transform: `translateX(${translateX}%)`,
                transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                gap: '15px' /* Espacio entre cards */
              }}
            >
              {productosNuevos.map((producto) => (
                <div 
                  key={producto.id} 
                  className="flex-shrink-0"
                  style={{ 
                    width: `calc(${100 / itemsToShow}% - 15px)` /* Ancho ajustado para el gap */
                  }}
                >
                  <div 
                    className="card border-0 h-100 position-relative bg-white"
                    style={{
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                    }}
                  >
                    {/* Badge de nuevo */}
                    <div className="position-absolute top-0 start-0" style={{ zIndex: 2 }}>
                      <span 
                        className="badge bg-success text-white px-2 py-1 rounded-end"
                        style={{ fontSize: '0.7rem' }}
                      >
                        <Star size={10} className="me-1" fill="currentColor" />
                        NUEVO
                      </span>
                    </div>

                    {/* Badge de descuento */}
                    {producto.descuento && (
                      <div className="position-absolute top-0 end-0" style={{ zIndex: 2 }}>
                        <span 
                          className="badge bg-danger text-white px-2 py-1 rounded-start"
                          style={{ fontSize: '0.7rem' }}
                        >
                          -{producto.descuento}
                        </span>
                      </div>
                    )}

                    {/* Imagen */}
                    <div 
                      className="position-relative overflow-hidden mb-3"
                      style={{ 
                        height: '180px', 
                        borderRadius: '8px 8px 0 0',
                        backgroundColor: '#f8f9fa'
                      }}
                    >
                      <img
                        src={producto.imagen || IMAGEN_POR_DEFECTO}
                        alt={producto.descripcion}
                        className="w-100 h-100"
                        style={{ 
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }}
                        onError={(e) => { e.target.src = IMAGEN_POR_DEFECTO; }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                        }}
                      />
                    </div>

                    {/* Contenido */}
                    <div className="text-center px-3 pb-3">
                      <h6 
                        className="fw-bold text-dark mb-2"
                        style={{
                          fontSize: '0.9rem',
                          lineHeight: '1.2',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '2.4rem'
                        }}
                      >
                        {producto.descripcion}
                      </h6>
                      
                      {producto.detalle1 && (
                        <p 
                          className="text-muted mb-3"
                          style={{
                            fontSize: '0.75rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {producto.detalle1}
                        </p>
                      )}
                      
                      <div className="mb-3">
                        <p className="fw-bold text-success m-0" style={{ fontSize: '1.1rem' }}>
                          ${formatearPrecio(producto.precioVenta)}
                        </p>
                        {producto.descuento && (
                          <small className="text-muted text-decoration-line-through">
                            ${formatearPrecio((parseFloat(producto.precioVenta) * 1.1).toFixed(2))}
                          </small>
                        )}
                      </div>

                      {/* Botón de acción */}
                      <button 
                        className="btn btn-success btn-sm px-3 py-2"
                        style={{ fontSize: '0.8rem', fontWeight: '600' }}
                      >
                        Ver producto
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controles de navegación */}
          {maxSlides > 0 && (
            <>
              <button 
                className="btn btn-white position-absolute top-50 translate-middle-y shadow"
                style={{ 
                  left: '-15px',
                  width: '45px',
                  height: '45px',
                  borderRadius: '50%',
                  border: '2px solid #198754',
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white'
                }}
                onClick={prevSlide}
                aria-label="Producto anterior"
              >
                <ChevronLeft size={20} className="text-success" />
              </button>

              <button 
                className="btn btn-white position-absolute top-50 translate-middle-y shadow"
                style={{ 
                  right: '-15px',
                  width: '45px',
                  height: '45px',
                  borderRadius: '50%',
                  border: '2px solid #198754',
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white'
                }}
                onClick={nextSlide}
                aria-label="Siguiente producto"
              >
                <ChevronRight size={20} className="text-success" />
              </button>
            </>
          )}
        </div>

        {/* Indicadores */}
        {maxSlides > 0 && (
          <div className="d-flex justify-content-center mt-4 gap-2">
            {Array.from({ length: maxSlides + 1 }).map((_, index) => (
              <button
                key={index}
                className="btn p-0 border-0"
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: index === currentSlide ? '#198754' : 'rgba(25, 135, 84, 0.3)',
                  transition: 'all 0.3s ease',
                  boxShadow: index === currentSlide ? '0 0 0 2px rgba(25, 135, 84, 0.2)' : 'none'
                }}
                onClick={() => goToSlide(index)}
                aria-label={`Ir al grupo ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarruselProductos;