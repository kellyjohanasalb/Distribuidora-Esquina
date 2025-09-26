import { useState, useEffect } from 'react';
import axios from 'axios';

const IMAGEN_POR_DEFECTO =
  'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

const STORAGE_KEY = 'productos_destacados_cache';
const STORAGE_TIMESTAMP_KEY = 'productos_destacados_timestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

export default function useProductosNuevos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFromCache, setIsFromCache] = useState(false);

  // Función para guardar productos en localStorage
  const saveProductosToStorage = (productosData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(productosData));
      localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
      console.log('💾 Productos guardados en localStorage:', productosData.length);
    } catch (error) {
      console.error('❌ Error guardando en localStorage:', error);
    }
  };

  // Función para obtener productos del localStorage
  const getProductosFromStorage = () => {
    try {
      const savedProducts = localStorage.getItem(STORAGE_KEY);
      const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      
      if (savedProducts && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        const isExpired = age > CACHE_DURATION;
        
        console.log(`📱 Productos en cache: ${JSON.parse(savedProducts).length}, Edad: ${Math.round(age / (1000 * 60))} minutos, Expirado: ${isExpired}`);
        
        if (!isExpired) {
          return JSON.parse(savedProducts);
        } else {
          // Cache expirado, limpiar
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
          console.log('🗑️ Cache expirado, limpiando...');
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Error leyendo localStorage:', error);
      return null;
    }
  };

  // Detectar estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conexión restaurada');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log('📵 Conexión perdida');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchProductos = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsFromCache(false);
        
        console.log('📄 Iniciando fetch de productos...');
        
        // Si no hay internet, intentar cargar desde cache
        if (!isOnline) {
          console.log('📵 Sin conexión, buscando en cache...');
          const cachedProducts = getProductosFromStorage();
          
          if (cachedProducts && cachedProducts.length > 0) {
            console.log('✅ Productos cargados desde cache:', cachedProducts.length);
            setProductos(cachedProducts);
            setIsFromCache(true);
            setError('Sin conexión - Mostrando productos guardados');
            return;
          } else {
            console.log('❌ No hay productos en cache');
            setError('Sin conexión y sin productos guardados');
            setProductos([]);
            return;
          }
        }
        
        // URL actualizada del nuevo endpoint
        const baseURL = import.meta.env.VITE_BACKEND_URL;
        const fullURL = `${baseURL}api/featured-products`;
        console.log('🌐 URL completa:', fullURL);
        
        const { data } = await axios.get(fullURL, {
          headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 10000,
        });

        if (!mounted) return;

        console.log('✅ Respuesta recibida:', data);

        const list = Array.isArray(data) ? data : [data];
        
        if (list.length === 0) {
          console.log('⚠️ No se recibieron productos del servidor');
          
          // Intentar cargar desde cache como fallback
          const cachedProducts = getProductosFromStorage();
          if (cachedProducts && cachedProducts.length > 0) {
            console.log('🔄 Usando productos del cache como fallback');
            setProductos(cachedProducts);
            setIsFromCache(true);
            setError('Servidor sin productos - Mostrando productos guardados');
          } else {
            setProductos([]);
            setError('No hay productos disponibles');
          }
          return;
        }

        const adaptados = list.map((p, idx) => {
          console.log(`📦 Procesando producto ${idx + 1}:`, p);
          
          return {
            id: p.idArticulo ?? `art-${idx}`,
            descripcion: p.descripcion ?? 'Producto',
            imagen: p.imagen && typeof p.imagen === 'string' && p.imagen.trim() !== '' 
              ? p.imagen.trim() 
              : null,
            precio: p.precioVenta ?? 0,
            esNuevo: true,
            fechaGuardado: new Date().toISOString() // Para debug
          };
        });

        console.log('✨ Productos adaptados:', adaptados);
        
        // Guardar en localStorage para uso offline
        saveProductosToStorage(adaptados);
        
        setProductos(adaptados);
        setIsFromCache(false);
        
      } catch (e) {
        console.warn('⚠️ Error conectando con servidor:', {
          message: e.message,
          status: e.response?.status,
          url: e.config?.url
        });
        
        if (mounted) {
          // Intentar cargar desde cache como fallback
          const cachedProducts = getProductosFromStorage();
          
          if (cachedProducts && cachedProducts.length > 0) {
            console.log('🔄 Error de servidor, usando cache:', cachedProducts.length);
            setProductos(cachedProducts);
            setIsFromCache(true);
            
            if (e.code === 'ECONNABORTED') {
              setError('Servidor lento - Mostrando productos guardados');
            } else if (e.response?.status === 404) {
              setError('Servidor no disponible - Mostrando productos guardados');
            } else {
              setError('Error de conexión - Mostrando productos guardados');
            }
          } else {
            // No hay cache disponible
            setProductos([]);
            
            if (!isOnline) {
              setError('Sin conexión y sin productos guardados');
            } else if (e.code === 'ECONNABORTED') {
              setError('Timeout: La conexión tardó demasiado');
            } else if (e.response?.status === 404) {
              setError('Endpoint no encontrado (404)');
            } else if (e.response?.status === 500) {
              setError('Error interno del servidor (500)');
            } else {
              setError('No se puede conectar al servidor');
            }
          }
        }
        
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProductos();
    
    return () => {
      mounted = false;
    };
  }, [isOnline]); // Reintenta cuando cambia el estado de conexión

  // Función para limpiar cache manualmente (útil para debug)
  const clearCache = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    console.log('🗑️ Cache limpiado manualmente');
  };

  // Función para obtener info del cache
  const getCacheInfo = () => {
    const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
    const savedProducts = localStorage.getItem(STORAGE_KEY);
    
    if (timestamp && savedProducts) {
      const age = Date.now() - parseInt(timestamp);
      const productsCount = JSON.parse(savedProducts).length;
      
      return {
        hasCache: true,
        productsCount,
        ageInMinutes: Math.round(age / (1000 * 60)),
        isExpired: age > CACHE_DURATION
      };
    }
    
    return { hasCache: false };
  };

  return { 
    productos, 
    loading, 
    error, 
    isOnline,
    isFromCache,
    hasProducts: productos.length > 0,
    clearCache, // Para debug
    cacheInfo: getCacheInfo() // Para debug
  };
}