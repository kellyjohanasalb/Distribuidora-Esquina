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
        const { data } = await axios.get('/api/products/featured', {
          headers: { Accept: 'application/json' },
        });

        if (!mounted) return;

        const list = Array.isArray(data) ? data : [];
        const adaptados = list.map((p, idx) => ({
          id: p.idArticulo ?? `art-${idx}`,
          descripcion: p.descripcion ?? 'Producto',
          imagen: p.imagen || IMAGEN_POR_DEFECTO,
          precio: p.precioVenta ?? 0,
          esNuevo: true,
        }));

        setProductos(adaptados);
      } catch (e) {
        setError(e?.message ?? 'Error al cargar productos destacados');
        setProductos([]); // si falla, dejamos vacío y que el carrusel use placeholders
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProductos();
    return () => {
      mounted = false;
    };
  }, []);

  return { productos, loading, error };
}
