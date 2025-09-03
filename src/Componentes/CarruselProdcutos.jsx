/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star, Sparkles } from 'lucide-react';
import useProductosNuevos from '../Hooks/useProdcutosNuevos';

// SVG inline para mejor rendimiento
const ImagenPlaceholder = () => (
  <svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%' viewBox='0 0 300 200'>
    <rect width='300' height='200' fill='#f8f9fa' stroke='#198754' strokeWidth='2' rx='8'/>
    <g transform='translate(150,80)'>
      <path d='M-20,-10 L20,-10 L20,10 L-20,10 Z M-15,-5 L15,-5 L15,5 L-15,5 Z' fill='#198754' opacity='0.3'/>
      <circle cx='8' cy='-2' r='3' fill='#198754'/>
      <path d='M-10,8 L-5,3 L0,8 L10,0 L15,5 L15,8 Z' fill='#198754'/>
    </g>
    <text x='50%' y='75%' fontFamily='-apple-system, BlinkMacSystemFont, sans-serif' fontSize='14' fill='#198754' textAnchor='middle' fontWeight='500'>
      Producto sin imagen
    </text>
  </svg>
);

const CarruselProductos = () => {
  const { productos, loading } = useProductosNuevos();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(4);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // Función para validar URLs de imagen
  const isValidImageUrl = useCallback((url) => {
    if (!url || typeof url !== 'string') return false;
    
    // Verificar si es una URL válida o data URL
    try {
      const parsedUrl = new URL(url, window.location.origin);
      // Permitir solo URLs HTTP/HTTPS o data URLs de imagen
      return parsedUrl.protocol === 'http:' || 
             parsedUrl.protocol === 'https:' || 
             parsedUrl.protocol === 'data:';
    } catch (e) {
      // Si falla la construcción de URL, verificar si es una ruta relativa válida
      return /^[./]?[a-zA-Z0-9_/-]+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    }
  }, []);

  // placeholders para cuando no hay productos del backend (o mientras carga)
  const placeholders = Array.from({ length: 6 }, (_, i) => ({
    id: `ph-${i}`,
    imagen: null,
    descripcion: 'Próximamente',
    esNuevo: true,
  }));

  // siempre habrá algo que renderizar: productos reales o placeholders
  const items = (productos && productos.length > 0) ? productos : placeholders;

  // Efecto para manejar el redimensionamiento de la ventana
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowSize({ width, height: window.innerHeight });
      
      if (width >= 1200) {
        setItemsToShow(4);
      } else if (width >= 992) {
        setItemsToShow(3);
      } else if (width >= 768) {
        setItemsToShow(2);
      } else if (width >= 576) {
        setItemsToShow(2);
      } else {
        setItemsToShow(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-play del carrusel (usa items, no rompe si son placeholders)
  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => {
        const maxSlides = Math.max(0, items.length - itemsToShow);
        return prev >= maxSlides ? 0 : prev + 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [items.length, itemsToShow]);

  const nextSlide = () => {
    const maxSlides = Math.max(0, items.length - itemsToShow);
    setCurrentSlide(prev => (prev >= maxSlides ? 0 : prev + 1));
  };

  const prevSlide = () => {
    const maxSlides = Math.max(0, items.length - itemsToShow);
    setCurrentSlide(prev => (prev <= 0 ? maxSlides : prev - 1));
  };

  const goToSlide = (index) => setCurrentSlide(index);

  const maxSlides = Math.max(0, items.length - itemsToShow);
  const translateX = -(currentSlide * (100 / itemsToShow));

  // Valores responsivos basados en windowSize
  const isSmallScreen = windowSize.width < 768;
  const isXSmallScreen = windowSize.width < 576;
  
  const cardHeight = isXSmallScreen ? '120px' : isSmallScreen ? '130px' : '140px';
  const badgeFontSize = isSmallScreen ? '0.6rem' : '0.65rem';
  const starSize = isSmallScreen ? 7 : 8;
  const chevronSize = isSmallScreen ? 14 : 16;
  const controlButtonSize = isSmallScreen ? '30px' : '35px';
  const controlButtonPosition = isSmallScreen ? '-8px' : '-12px';
  const gapSize = isXSmallScreen ? '8px' : isSmallScreen ? '10px' : '12px';
  const itemWidth = `calc(${100 / itemsToShow}% - ${gapSize})`;
  const borderRadius = isSmallScreen ? '6px' : '8px';
  const gradientHeight = isSmallScreen ? '40px' : '50px';
  const indicatorSize = isSmallScreen ? '6px' : '8px';

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
              padding: isSmallScreen ? '10px' : '15px'
            }}
          >
            <div
              className="d-flex"
              style={{
                transform: `translateX(${translateX}%)`,
                transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                gap: gapSize
              }}
            >
              {items.map((producto) => (
                <div
                  key={producto.id}
                  className="flex-shrink-0"
                  style={{ width: itemWidth }}
                >
                  <div
                    className="card border-0 h-100 position-relative bg-white"
                    style={{
                      borderRadius: borderRadius,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      height: cardHeight
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
                          fontSize: badgeFontSize,
                          fontWeight: '600',
                          letterSpacing: '0.5px'
                        }}
                      >
                        <Star size={starSize} className="me-1" fill="currentColor" />
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
                      {isValidImageUrl(producto.imagen) ? (
                        <img
                          src={producto.imagen}
                          alt={producto.descripcion}
                          className="w-100 h-100"
                          style={{
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease'
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextSibling.style.display = 'block';
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        />
                      ) : null}
                      
                      {/* Mostrar placeholder si la imagen no es válida o falla */}
                      <div 
                        className="w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{
                          display: isValidImageUrl(producto.imagen) ? 'none' : 'flex',
                          padding: '10px'
                        }}
                      >
                        <ImagenPlaceholder />
                      </div>

                      {/* Overlay con gradiente para mejor legibilidad del badge */}
                      <div
                        className="position-absolute top-0 start-0 w-100"
                        style={{
                          height: gradientHeight,
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
                  left: controlButtonPosition,
                  width: controlButtonSize,
                  height: controlButtonSize,
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
                <ChevronLeft size={chevronSize} className="text-success" />
              </button>

              <button
                className="btn btn-white position-absolute top-50 translate-middle-y shadow"
                style={{
                  right: controlButtonPosition,
                  width: controlButtonSize,
                  height: controlButtonSize,
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
                <ChevronRight size={chevronSize} className="text-success" />
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
                  width: indicatorSize,
                  height: indicatorSize,
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