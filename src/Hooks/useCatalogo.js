// src/Hooks/useCatalogo.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useCatalogo = () => {
  const [productos, setProductos] = useState([]);
  const [rubros, setRubros] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRubro, setFiltroRubro] = useState('');
  const [cursor, setCursor] = useState('');
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sugerencias, setSugerencias] = useState([]);
  
  // Debounce para evitar llamadas excesivas
  const [debounceTimer, setDebounceTimer] = useState(null);

  useEffect(() => {
    fetchRubros();
  }, []);

  // Efecto separado para manejar cambios en filtros con debounce
  useEffect(() => {
    // Limpiar timer anterior
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Crear nuevo timer
    const newTimer = setTimeout(() => {
      resetProductos();
    }, 300); // 300ms de debounce

    setDebounceTimer(newTimer);

    // Cleanup
    return () => {
      if (newTimer) {
        clearTimeout(newTimer);
      }
    };
  }, [busqueda, filtroRubro]);

  const fetchRubros = async () => {
    try {
      const response = await axios.get('https://remito-send-back.vercel.app/api/rubros');
      setRubros(response.data);
    } catch (error) {
      console.error('Error al obtener rubros', error);
    }
  };

  const resetProductos = async () => {
    setProductos([]);
    setCursor('');
    setHasNextPage(true);
    await fetchProductos(true);
  };

  const fetchProductos = async (initial = false) => {
    if (!hasNextPage || isLoading) return;
    setIsLoading(true);
    
    const params = {
      limit: 20,
      cursor: initial ? undefined : cursor
    };

    // Solo agregar búsqueda si tiene al menos 2 caracteres
    if (busqueda.trim().length >= 2) {
      params.description = busqueda.trim();
    }

    // Solo agregar filtro de rubro si está seleccionado
    if (filtroRubro && filtroRubro !== '' && !isNaN(Number(filtroRubro))) {
      params.rubro = Number(filtroRubro);
    }

    try {
      const response = await axios.get('https://remito-send-back.vercel.app/api/products/catalog', { params });
      const { items, pagination } = response.data;

      // Formatear precios con 2 decimales
      const productosFormateados = items.map(producto => ({
        ...producto,
        precioVenta: formatearPrecio(producto.precioVenta)
      }));

      setProductos(prev => initial ? productosFormateados : [...prev, ...productosFormateados]);
      setCursor(pagination.nextCursor || '');
      setHasNextPage(pagination.hasNextPage);
    } catch (error) {
      console.error('Error al obtener productos', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para formatear precios
  const formatearPrecio = (precio) => {
    const numero = parseFloat(precio);
    return isNaN(numero) ? '0.00' : numero.toFixed(2);
  };

  // Función mejorada para generar sugerencias
  const generarSugerencias = useCallback((valor) => {
    if (!valor || valor.length < 2) {
      setSugerencias([]);
      return;
    }

    const valorLimpio = valor.toLowerCase().trim();
    const sugerenciasFiltradas = productos
      .filter(producto => 
        producto.descripcion.toLowerCase().includes(valorLimpio)
      )
      .slice(0, 8) // Limitar a 8 sugerencias
      .map(producto => ({
        value: producto.idArticulo,
        label: producto.descripcion
      }));

    setSugerencias(sugerenciasFiltradas);
  }, [productos]);

  const handleBusquedaChange = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    
    // Generar sugerencias en tiempo real
    generarSugerencias(valor);
  };

  const handleRubroChange = (e) => {
    const valor = e.target.value;
    setFiltroRubro(String(valor));
    
    // Limpiar búsqueda cuando se cambia el rubro para evitar conflictos
    // Solo si queremos que sean mutuamente excluyentes
    // setBusqueda('');
  };

  // Función para seleccionar una sugerencia
  const seleccionarSugerencia = (sugerencia) => {
    setBusqueda(sugerencia.label);
    setSugerencias([]);
  };

    const reiniciarFiltros = () => {
    setBusqueda('');
    setFiltroRubro('');
    setSugerencias([]);
  };

  return {
    productos,
    rubros,
    busqueda,
    filtroRubro,
    sugerencias,
    handleBusquedaChange,
    handleRubroChange,
    seleccionarSugerencia,
    fetchProductos,
    hasNextPage,
    isLoading,
    reiniciarFiltros
  };
};

export default useCatalogo;