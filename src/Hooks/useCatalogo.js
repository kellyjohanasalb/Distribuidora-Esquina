import { useState, useEffect } from 'react';
import axios from 'axios';

const useCatalogo = () => {
  const [productos, setProductos] = useState([]);
  const [rubros, setRubros] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRubro, setFiltroRubro] = useState('');
  const [cursor, setCursor] = useState('');
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRubros();
    resetProductos(); // cargar los primeros productos
  }, [busqueda, filtroRubro]);

  const fetchRubros = async () => {
    try {
      const response = await axios.get('https://remito-send-back.vercel.app/api/rubros');
      setRubros(response.data); // [{ id, descripcion }]
    } catch (error) {
      console.error('Error al obtener rubros', error);
    }
  };

  const resetProductos = async () => {
    setProductos([]);
    setCursor('');
    setHasNextPage(true);
    await fetchProductos(true); // primer batch
  };

  const fetchProductos = async (initial = false) => {
    if (!hasNextPage || isLoading) return;
    setIsLoading(true);

    const params = {
      limit: 20,
      description: busqueda.length >= 2 ? busqueda : undefined,
      rubro: filtroRubro ? Number(filtroRubro) : undefined,
      cursor: initial ? undefined : cursor
    };

    try {
      const response = await axios.get('https://remito-send-back.vercel.app/api/products/catalog', { params });
      const { items, pagination } = response.data;

      setProductos(prev => initial ? items : [...prev, ...items]);
      setCursor(pagination.nextCursor || '');
      setHasNextPage(pagination.hasNextPage);
    } catch (error) {
      console.error('Error al obtener productos', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBusquedaChange = (e) => setBusqueda(e.target.value);
  const handleRubroChange = (e) => setFiltroRubro(e.target.value);

  return {
    productos,
    rubros,
    busqueda,
    filtroRubro,
    handleBusquedaChange,
    handleRubroChange,
    fetchProductos, // para cargar más
    hasNextPage,
    isLoading
  };
};

export default useCatalogo;