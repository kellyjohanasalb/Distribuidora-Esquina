import { useState, useEffect } from 'react';
import axios from 'axios';

const IMAGEN_POR_DEFECTO =
  'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

export default function useProductosNuevos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

  const fetchProductos = async () => {
  try {
    setLoading(true);
    setError(null);
    
    console.log('🔄 Iniciando fetch de productos...');
    
    // Usamos la URL del backend en producción y desarrollo
    const baseURL = 'https://remito-send-back.vercel.app';
    const fullURL = `${baseURL}/api/products/featured`;
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

        const list = Array.isArray(data) ? data : [data]; // Asegurar que sea un array
        
        if (list.length === 0) {
          console.log('⚠️ No se recibieron productos');
          setProductos([]);
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
          };
        });

        console.log('✨ Productos adaptados:', adaptados);
        setProductos(adaptados);
        
      } catch (e) {
        console.error('❌ Error detallado:', {
          message: e.message,
          status: e.response?.status,
          statusText: e.response?.statusText,
          data: e.response?.data,
          url: e.config?.url
        });
        
        // Mensaje de error más específico
        let errorMessage = 'Error al cargar productos destacados';
        
        if (e.code === 'ECONNABORTED') {
          errorMessage = 'Timeout: La conexión tardó demasiado';
        } else if (e.response?.status === 404) {
          errorMessage = 'Endpoint no encontrado (404)';
        } else if (e.response?.status === 500) {
          errorMessage = 'Error interno del servidor (500)';
        } else if (!e.response) {
          errorMessage = 'No se puede conectar al servidor';
        }
        
        setError(errorMessage);
        setProductos([]); // No mostrar productos de ejemplo
        
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
  }, []);

  return { productos, loading, error };
}