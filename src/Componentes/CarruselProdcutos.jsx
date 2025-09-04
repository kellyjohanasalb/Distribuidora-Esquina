/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star, Sparkles, AlertCircle, Wifi, WifiOff } from 'lucide-react';
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
  const { productos, loading, error } = useProductosNuevos();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(4);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // Función mejorada para validar URLs de imagen
  const isValidImageUrl = useCallback((url) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return false;
    
    const cleanUrl = url.trim();
    
    try {
      const parsedUrl = new URL(cleanUrl);
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        return parsedUrl.hostname.length > 0;
      }
      return parsedUrl.protocol === 'data:';
    } catch (e) {
      return /^[./]?[\w/-]+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(cleanUrl);
    }
  }, []);

  // Manejar errores de imagen
  const handleImageError = useCallback((productId, imageUrl) => {
    console.error(`❌ Error cargando imagen del producto ${productId}: ${imageUrl}`);
    setImageErrors(prev => new Set([...prev, productId]));
  }, []);

  const handleImageLoad = useCallback((productId, imageUrl) => {
    console.log(`✅ Imagen cargada exitosamente para producto ${productId}: ${imageUrl}`);
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  }, []);

  // Placeholders mejorados con más variedad
  const placeholders = Array.from({ length: 6 }, (_, i) => ({
    id: `placeholder-${i}`,
    imagen: null,
    descripcion: i === 0 ? 'Próximamente' : `Producto ${i + 1}`,
    precio: (i + 1) * 500,
    esNuevo: true,
  }));

  const items = (productos && productos.length > 0) ? productos : placeholders;

  // Debug mejorado
  useEffect(() => {
    console.log('🔍 Estado del carrusel:', { 
      loading, 
      error, 
      productosLength: productos?.length,
      itemsLength: items?.length,
      imageErrors: Array.from(imageErrors)
    });
    
    if (productos && productos.length > 0) {
      console.log('📦 Productos disponibles:', productos.map(p => ({
        id: p.id,
        descripcion: p.descripcion,
        tieneImagen: !!p.imagen,
        imagen: p.imagen
      })));
    }
  }, [loading, error, productos, items, imageErrors]);

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

  // Auto-play del carrusel
  useEffect(() => {
    if (items.length === 0 || loading) return;
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => {
        const maxSlides = Math.max(0, items.length - itemsToShow);
        return prev >= maxSlides ? 0 : prev + 1;
      });
    }, 4000);
    
    return () => clearInterval(interval);
  }, [items.length, itemsToShow, loading]);

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

  // Valores responsivos
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
          
          {/* Estado de conexión mejorado */}
          {loading && (
            <div className="alert alert-info d-flex align-items-center small">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <span>Conectando con el servidor...</span>
            </div>
          )}
          
          {error && (
            <div className="alert alert-warning d-flex align-items-center small">
              <WifiOff size={16} className="me-2 text-warning" />
              <div className="text-start">
                <strong>Conexión limitada:</strong> {error}
              </div>
            </div>
          )}
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
                transition: loading ? 'none' : 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                gap: gapSize
              }}
            >
              {items.map((producto) => {
                const hasValidImage = isValidImageUrl(producto.imagen);
                const hasImageError = imageErrors.has(producto.id);
                const shouldShowImage = hasValidImage && !hasImageError;
                
                return (
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
                        boxShadow: loading ? '0 2px 8px rgba(0,0,0,0.05)' : '0 2px 8px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        height: cardHeight,
                        opacity: loading ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }
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

                      {/* Loading overlay */}
                      {loading && (
                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light bg-opacity-50" style={{ zIndex: 3 }}>
                          <div className="spinner-border text-success" role="status">
                            <span className="visually-hidden">Cargando...</span>
                          </div>
                        </div>
                      )}

                      {/* Contenido de la imagen */}
                      <div
                        className="position-relative overflow-hidden w-100 h-100"
                        style={{
                          borderRadius: '8px',
                          backgroundColor: '#f8f9fa'
                        }}
                      >
                        {shouldShowImage ? (
                          <img
                            src={producto.imagen}
                            alt={producto.descripcion}
                            className="w-100 h-100"
                            style={{
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease'
                            }}
                            onError={() => handleImageError(producto.id, producto.imagen)}
                            onLoad={() => handleImageLoad(producto.id, producto.imagen)}
                            onMouseEnter={(e) => {
                              if (!loading) {
                                e.currentTarget.style.transform = 'scale(1.05)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!loading) {
                                e.currentTarget.style.transform = 'scale(1)';
                              }
                            }}
                          />
                        ) : (
                          <div 
                            className="w-100 h-100 d-flex align-items-center justify-content-center"
                            style={{ padding: '10px' }}
                          >
                            <ImagenPlaceholder />
                          </div>
                        )}

                        {/* Overlay con gradiente */}
                        <div
                          className="position-absolute top-0 start-0 w-100"
                          style={{
                            height: gradientHeight,
                            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 100%)',
                            pointerEvents: 'none'
                          }}
                        />

                        {/* Descripción del producto - MODIFICADO PARA MEJOR LEGIBILIDAD */}
                        <div
                          className="position-absolute bottom-0 start-0 w-100 text-center p-2"
                          style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            fontSize: isSmallScreen ? '0.7rem' : '0.8rem',
                            color: 'white',
                            fontWeight: '600',
                            textShadow: '0 1px 3px rgba(0,0,0,0.9)'
                          }}
                        >
                          {producto.descripcion}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
        {maxSlides > 0 && !loading && (
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