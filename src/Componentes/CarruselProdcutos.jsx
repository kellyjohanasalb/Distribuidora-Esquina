import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Sparkles } from 'lucide-react';

const CarruselProductos = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(4);

  const productosNuevos = [
    {
      id: 1,
      imagen: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&h=200&fit=crop",
      descripcion: "Aceite Girasol Premium 1.5L",
      esNuevo: true
    },
    {
      id: 2,
      imagen: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=300&h=200&fit=crop",
      descripcion: "Arroz Integral Premium 1kg",
      esNuevo: true
    },
    {
      id: 3,
      imagen: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=300&h=200&fit=crop",
      descripcion: "Café Molido Premium 500g",
      esNuevo: true
    },
    {
      id: 4,
      imagen: "https://images.unsplash.com/photo-1574448857443-dc1d7e9c4dad?w=300&h=200&fit=crop",
      descripcion: "Miel Natural 750ml",
      esNuevo: true
    },
    {
      id: 5,
      imagen: "https://images.unsplash.com/photo-1628518254107-11c9dc78cbf6?w=300&h=200&fit=crop",
      descripcion: "Pasta Italiana 500g",
      esNuevo: true
    },
    {
      id: 6,
      imagen: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=300&h=200&fit=crop",
      descripcion: "Quinoa Orgánica 500g",
      esNuevo: true
    }
  ];

  const IMAGEN_POR_DEFECTO = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

  // Responsive: ajustar items según pantalla
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1200) {
        setItemsToShow(4); // Desktop XL: 4 items
      } else if (window.innerWidth >= 992) {
        setItemsToShow(3); // Desktop: 3 items
      } else if (window.innerWidth >= 768) {
        setItemsToShow(2); // Tablet: 2 items
      } else if (window.innerWidth >= 576) {
        setItemsToShow(2); // Mobile grande: 2 items
      } else {
        setItemsToShow(1); // Mobile pequeño: 1 item
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-play del carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => {
        const maxSlides = Math.max(0, productosNuevos.length - itemsToShow);
        return prev >= maxSlides ? 0 : prev + 1;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [productosNuevos.length, itemsToShow]);

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
            <Sparkles className="text-success" size={18} />
            <h4 className="text-success fw-bold m-0">Productos Nuevos</h4>
            <Sparkles className="text-success" size={18} />
          </div>
          <p className="text-muted small">Descubre nuestras últimas incorporaciones</p>
        </div>

        {/* Carrusel */}
        <div className="position-relative" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div 
            className="overflow-hidden" 
            style={{ 
              borderRadius: '8px',
              backgroundColor: 'transparent',
              padding: window.innerWidth < 768 ? '10px' : '15px' // Menos padding en mobile
            }}
          >
            <div 
              className="d-flex"
              style={{
                transform: `translateX(${translateX}%)`,
                transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                gap: window.innerWidth < 576 ? '8px' : window.innerWidth < 768 ? '10px' : '12px' // Gap adaptativo
              }}
            >
              {productosNuevos.map((producto) => (
                <div 
                  key={producto.id} 
                  className="flex-shrink-0"
                  style={{ 
                    width: `calc(${100 / itemsToShow}% - ${
                      window.innerWidth < 576 ? '8px' : 
                      window.innerWidth < 768 ? '10px' : '12px'
                    })` // Ancho adaptativo
                  }}
                >
                  <div 
                    className="card border-0 h-100 position-relative bg-white"
                    style={{
                      borderRadius: window.innerWidth < 768 ? '6px' : '8px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      height: window.innerWidth < 576 ? '120px' : // Mobile pequeño
                              window.innerWidth < 768 ? '130px' : // Mobile/Tablet
                              '140px' // Desktop
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    {/* Badge de nuevo */}
                    <div className="position-absolute top-0 start-0" style={{ zIndex: 2 }}>
                      <span 
                        className="badge bg-success text-white px-2 py-1 rounded-end"
                        style={{ 
                          fontSize: window.innerWidth < 768 ? '0.6rem' : '0.65rem',
                          fontWeight: '600',
                          letterSpacing: '0.5px'
                        }}
                      >
                        <Star size={window.innerWidth < 768 ? 7 : 8} className="me-1" fill="currentColor" />
                        NUEVO
                      </span>
                    </div>

                    {/* Imagen que ocupa toda la card */}
                    <div 
                      className="position-relative overflow-hidden w-100 h-100"
                      style={{ 
                        borderRadius: '8px',
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
                      
                      {/* Overlay con gradiente para mejor legibilidad del badge */}
                      <div 
                        className="position-absolute top-0 start-0 w-100"
                        style={{
                          height: window.innerWidth < 768 ? '40px' : '50px',
                          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 100%)',
                          pointerEvents: 'none'
                        }}
                      />
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
                  left: window.innerWidth < 768 ? '-8px' : '-12px',
                  width: window.innerWidth < 768 ? '30px' : '35px',
                  height: window.innerWidth < 768 ? '30px' : '35px',
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
                <ChevronLeft size={window.innerWidth < 768 ? 14 : 16} className="text-success" />
              </button>

              <button 
                className="btn btn-white position-absolute top-50 translate-middle-y shadow"
                style={{ 
                  right: window.innerWidth < 768 ? '-8px' : '-12px',
                  width: window.innerWidth < 768 ? '30px' : '35px',
                  height: window.innerWidth < 768 ? '30px' : '35px',
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
                <ChevronRight size={window.innerWidth < 768 ? 14 : 16} className="text-success" />
              </button>
            </>
          )}
        </div>

        {/* Indicadores */}
        {maxSlides > 0 && (
          <div className="d-flex justify-content-center mt-3 gap-1">
            {Array.from({ length: maxSlides + 1 }).map((_, index) => (
              <button
                key={index}
                className="btn p-0 border-0"
                style={{
                  width: window.innerWidth < 768 ? '6px' : '8px',
                  height: window.innerWidth < 768 ? '6px' : '8px',
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