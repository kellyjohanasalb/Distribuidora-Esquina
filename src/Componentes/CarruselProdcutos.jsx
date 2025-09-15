/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const { productos, loading, error, isOnline, isFromCache } = useProductosNuevos();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(4);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // Refs y estilo del track (usaremos px para que la última card no se corte)
  const containerRef = useRef(null); // contenedor visible (overflow-hidden)
  const trackRef = useRef(null);     // track que contiene los items
  const [trackStyle, setTrackStyle] = useState({ transform: 'translateX(0px)' });

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

  // Placeholders y límite a 6 productos (igual que tú querías)
  const placeholders = Array.from({ length: 6 }, (_, i) => ({
    id: `placeholder-${i}`,
    imagen: null,
    descripcion: i === 0 ? 'Próximamente' : `Producto ${i + 1}`,
    precio: (i + 1) * 500,
    esNuevo: true,
  }));

  const items = (productos && productos.length > 0) ? productos.slice(0, 6) : placeholders.slice(0, 6);

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

  // POSICIONES (desplazamiento por 1 item): número de pasos posibles
  const maxSlides = Math.max(0, items.length - itemsToShow); // ej. con 6 items y 4 a la vista -> 2 (posiciones 0..2)
  const indicatorsCount = maxSlides + 1;

  // Mantener currentSlide válido si cambian itemsToShow/items
  useEffect(() => {
    if (currentSlide > maxSlides) {
      setCurrentSlide(maxSlides);
    }
  }, [maxSlides, currentSlide]);

  // Autoplay (usa maxSlides)
  useEffect(() => {
    if (items.length === 0 || loading) return;
    if (maxSlides <= 0) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev >= maxSlides ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [items.length, itemsToShow, loading, maxSlides]);

  const nextSlide = () => setCurrentSlide(prev => (prev >= maxSlides ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide(prev => (prev <= 0 ? maxSlides : prev - 1));
  const goToSlide = (index) => setCurrentSlide(index);

  // ----------------------------
  // Nuevo: cálculo en píxeles para que la última card se vea completa
  // ----------------------------
  useEffect(() => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) {
      setTrackStyle({ transform: 'translateX(0px)' });
      return;
    }

    const children = Array.from(track.children);
    if (children.length === 0) {
      setTrackStyle({ transform: 'translateX(0px)' });
      return;
    }

    // índice seguro (no pasarnos)
    const index = Math.min(currentSlide, maxSlides);

    // elemento objetivo: alinea su left con el left del contenedor
    const target = children[index];
    // offsetLeft del objetivo respecto al track
    const offset = target.offsetLeft;

    // shift máximo para que no mostremos espacio vacío después del último item
    const maxShift = Math.max(0, track.scrollWidth - container.clientWidth);

    // queremos desplazar exactamente hasta offset, pero sin pasar maxShift
    let shift = offset;
    if (shift > maxShift) shift = maxShift;

    // aplica el transform en px — esto evita recortes
    setTrackStyle({
      transform: `translateX(-${shift}px)`,
    });

    // Forzar repaint si necesitas (normalmente no)
  }, [currentSlide, itemsToShow, windowSize.width, items.length, loading, maxSlides]);

  // estilos responsivos y tamaños (se mantienen como en tu versión)
  const isSmallScreen = windowSize.width < 768;
  const isXSmallScreen = windowSize.width < 576;
  const cardHeight = isXSmallScreen ? '180px' : isSmallScreen ? '200px' : '220px';
  const imageHeight = isXSmallScreen ? '110px' : isSmallScreen ? '130px' : '150px';
  const badgeFontSize = isSmallScreen ? '0.55rem' : '0.6rem';
  const starSize = isSmallScreen ? 6 : 7;
  const gapSize = isXSmallScreen ? '6px' : isSmallScreen ? '8px' : '10px';
  const itemWidth = `calc(${100 / itemsToShow}% - ${gapSize})`;
  const borderRadius = isSmallScreen ? '5px' : '6px';
  const indicatorSize = isSmallScreen ? '5px' : '6px';

  return (
    <div className="py-3 mb-2" style={{ backgroundColor: '#f7dc6f' }}>
      <div className="container">
        {/* Título */}
        <div className="text-center mb-3">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
            <Sparkles className="text-success" size={16} />
            <h4 className="text-success fw-bold m-0" style={{ fontSize: isSmallScreen ? '1.1rem' : '1.3rem' }}>Productos Nuevos</h4>
            <Sparkles className="text-success" size={16} />
          </div>
          <p className="text-muted small mb-0">Descubre nuestras últimas incorporaciones</p>

          {loading && (
            <div className="alert alert-info d-flex align-items-center small mt-2 py-1">
              <div className="spinner-border spinner-border-sm me-2" role="status"><span className="visually-hidden">Cargando...</span></div>
              <span>Conectando con el servidor...</span>
            </div>
          )}

          {error && (
            <div className="alert alert-warning d-flex align-items-center small mt-2 py-1">
              {isOnline ? <AlertCircle size={14} className="me-2 text-warning" /> : <WifiOff size={14} className="me-2 text-warning" />}
              <div className="text-start">
                <strong style={{ fontSize: '0.8rem' }}>{isFromCache ? 'Modo offline:' : 'Error:'}</strong>
                <span style={{ fontSize: '0.8rem' }}> {error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Carrusel */}
        <div className="position-relative" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div
            ref={containerRef}
            className="overflow-hidden"
            style={{
              borderRadius: '6px',
              backgroundColor: 'transparent',
              padding: isSmallScreen ? '8px' : '12px'
            }}
          >
            <div
              ref={trackRef}
              className="d-flex"
              style={{
                // usamos el transform en px calculado arriba
                ...trackStyle,
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
                    className="flex-shrink-0 mx-auto"
                    style={{
                      width: itemWidth,
                      aspectRatio: '1/1',
                      maxHeight: isXSmallScreen ? '180px' : isSmallScreen ? '200px' : 'auto',
                      maxWidth: isXSmallScreen ? '220px' : isSmallScreen ? '240px' : 'none'
                    }}
                  >
                    <div
                      className="card border-0 h-100 position-relative bg-white"
                      style={{
                        borderRadius: borderRadius,
                        transition: 'all 0.3s ease',
                        boxShadow: loading ? '0 1px 4px rgba(0,0,0,0.05)' : '0 2px 6px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        height: cardHeight,
                        opacity: loading ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
                        }
                      }}
                    >
                      <div className="position-absolute top-0 start-0" style={{ zIndex: 2 }}>
                        <span className="badge bg-success text-white px-1 py-1 rounded-end" style={{ fontSize: badgeFontSize, fontWeight: '600', letterSpacing: '0.3px' }}>
                          <Star size={starSize} className="me-1" fill="currentColor" />
                          NUEVO
                        </span>
                      </div>

                      {loading && (
                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light bg-opacity-50" style={{ zIndex: 3 }}>
                          <div className="spinner-border text-success" style={{ width: '1.5rem', height: '1.5rem' }} role="status">
                            <span className="visually-hidden">Cargando...</span>
                          </div>
                        </div>
                      )}

                      <div className="position-relative overflow-hidden w-100 d-flex align-items-center justify-content-center" style={{ borderRadius: `${borderRadius} ${borderRadius} 0 0`, backgroundColor: '#f8f9fa', height: imageHeight, padding: '8px' }}>
                        {shouldShowImage ? (
                          <img
                            src={producto.imagen}
                            alt={producto.descripcion}
                            className="h-100"
                            style={{ objectFit: 'contain', transition: 'transform 0.3s ease', maxWidth: '100%', maxHeight: '100%' }}
                            onError={() => handleImageError(producto.id, producto.imagen)}
                            onLoad={() => handleImageLoad(producto.id, producto.imagen)}
                            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1)'; }}
                          />
                        ) : (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center" style={{ padding: '5px' }}>
                            <ImagenPlaceholder />
                          </div>
                        )}
                      </div>

                      <div className="w-100 p-1 text-center d-flex align-items-center justify-content-center" style={{ height: `calc(${cardHeight} - ${imageHeight})`, backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: '0 0 6px 6px' }}>
                        <div className="fw-semibold" style={{
                          fontSize: isSmallScreen ? '0.7rem' : '0.8rem',
                          color: 'white',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: '1.2',
                          padding: '0 4px'
                        }}>
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
          {indicatorsCount > 1 && !loading && (
            <>
              <button
                className="btn position-absolute top-50 translate-middle-y shadow"
                style={{
                  left: '-12px',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  border: '2px solid #198754',
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                }}
                onClick={prevSlide}
                aria-label="Producto anterior"
              >
                <ChevronLeft size={16} className="text-success" />
              </button>

              <button
                className="btn position-absolute top-50 translate-middle-y shadow"
                style={{
                  right: '-12px',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  border: '2px solid #198754',
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                }}
                onClick={nextSlide}
                aria-label="Siguiente producto"
              >
                <ChevronRight size={16} className="text-success" />
              </button>
            </>
          )}
        </div>

        {/* Indicadores */}
        {indicatorsCount > 1 && !loading && (
          <div className="d-flex justify-content-center mt-2 gap-1">
            {Array.from({ length: indicatorsCount }).map((_, index) => (
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
