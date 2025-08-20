/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useCatalogo = () => {
  // Estado inicial cargando desde localStorage
  const [todosCatalogo, setTodosCatalogo] = useState(() => {
    const guardado = localStorage.getItem("catalogoCompleto");
    return guardado ? JSON.parse(guardado) : [];
  });
  
  const [productos, setProductos] = useState([]);
  const [rubros, setRubros] = useState(() => {
    const guardado = localStorage.getItem("rubros");
    return guardado ? JSON.parse(guardado) : [];
  });

  const [busqueda, setBusqueda] = useState('');
  const [filtroRubro, setFiltroRubro] = useState('');
  const [cursor, setCursor] = useState('');
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sugerencias, setSugerencias] = useState([]);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [catalogoCompleto, setCatalogoCompleto] = useState(false);

  // Carga inicial
  useEffect(() => {
    if (navigator.onLine) {
      fetchRubros();
      cargarCatalogoCompleto();
    } else {
      // Modo offline: aplicar filtros a datos locales
      aplicarFiltrosLocales();
    }
  }, []);

  // Debounce solo para búsqueda, filtro de rubro es inmediato
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    
    // Si cambió el rubro, aplicar inmediatamente sin debounce
    if (filtroRubro !== undefined) {
      const newTimer = setTimeout(() => {
        if (navigator.onLine && !catalogoCompleto && busqueda.length >= 2) {
          resetProductos();
        } else {
          aplicarFiltrosLocales();
        }
      }, busqueda.length >= 2 ? 300 : 0); // Debounce solo si hay búsqueda activa
      
      setDebounceTimer(newTimer);
    } else {
      // Solo cambió la búsqueda
      aplicarFiltrosLocales();
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [busqueda, filtroRubro]);

  // Cargar catálogo completo (solo online)
  const cargarCatalogoCompleto = async () => {
    if (!navigator.onLine) return;
    
    setIsLoading(true);
    let todosLosProductos = [];
    let currentCursor = '';
    let hasMore = true;

    try {
      while (hasMore) {
        const params = {
          limit: 100, // Mayor límite para cargar más rápido
          cursor: currentCursor || undefined
        };

        const response = await axios.get(
          'https://remito-send-back.vercel.app/api/products/catalog',
          { params }
        );

        const { items, pagination } = response.data;
        
        const productosFormateados = items.map(producto => ({
          ...producto,
          precioVenta: formatearPrecio(producto.precioVenta)
        }));

        todosLosProductos = [...todosLosProductos, ...productosFormateados];
        currentCursor = pagination.nextCursor || '';
        hasMore = pagination.hasNextPage;
      }

      // Guardar catálogo completo en localStorage
      localStorage.setItem('catalogoCompleto', JSON.stringify(todosLosProductos));
      setTodosCatalogo(todosLosProductos);
      setCatalogoCompleto(true);

      // Aplicar filtros iniciales
      aplicarFiltrosLocales(todosLosProductos);

    } catch (error) {
      console.error('Error al cargar catálogo completo:', error);
      // Fallback a método anterior si falla
      fetchProductos(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Aplicar filtros a datos locales
  const aplicarFiltrosLocales = (catalogoAUsar = todosCatalogo) => {
    let productosFiltrados = [...catalogoAUsar];

    // Filtro por búsqueda - solo si hay al menos 2 caracteres
    if (busqueda.trim().length >= 2) {
      const termino = busqueda.toLowerCase().trim();
      productosFiltrados = productosFiltrados.filter(p =>
        p.descripcion.toLowerCase().includes(termino) ||
        p.codigo?.toLowerCase().includes(termino) ||
        p.detalle1?.toLowerCase().includes(termino)
      );
    } else if (busqueda.trim().length === 0) {
      // Si no hay búsqueda, mostrar todos (no filtrar por búsqueda)
    } else {
      // Si hay 1 carácter, no filtrar por búsqueda aún pero no mostrar todos
      // Mantener el filtro anterior o mostrar conjunto vacío
      if (!filtroRubro) {
        productosFiltrados = []; // No mostrar productos con solo 1 carácter
      }
    }

    // Filtro por rubro - siempre aplicar si está seleccionado
    if (filtroRubro && !isNaN(Number(filtroRubro))) {
      productosFiltrados = productosFiltrados.filter(
        p => String(p.idRubro) === String(filtroRubro)
      );
    }

    // Si no hay ningún filtro activo, mostrar todos los productos
    if (!busqueda.trim() && !filtroRubro) {
      productosFiltrados = [...catalogoAUsar];
    }

    setProductos(productosFiltrados);
    setHasNextPage(false); // En modo local no hay paginación
  };

  // Obtener rubros
  const fetchRubros = async () => {
    if (!navigator.onLine) return;
    try {
      const response = await axios.get('https://remito-send-back.vercel.app/api/rubros');
      setRubros(response.data);
      localStorage.setItem('rubros', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error al obtener rubros:', error);
    }
  };

  // Reset de productos (modo online paginado)
  const resetProductos = async () => {
    setProductos([]);
    setCursor('');
    setHasNextPage(true);
    await fetchProductos(true);
  };

  // Obtener productos paginados (solo para modo online sin catálogo completo)
  const fetchProductos = async (initial = false) => {
    if (!navigator.onLine) {
      aplicarFiltrosLocales();
      return;
    }

    if (catalogoCompleto) {
      aplicarFiltrosLocales();
      return;
    }

    if (!hasNextPage || isLoading) return;
    setIsLoading(true);

    const params = {
      limit: 20,
      cursor: initial ? undefined : cursor
    };

    if (busqueda.trim().length >= 2) {
      params.description = busqueda.trim();
    }
    if (filtroRubro && !isNaN(Number(filtroRubro))) {
      params.rubro = Number(filtroRubro);
    }

    try {
      const response = await axios.get(
        'https://remito-send-back.vercel.app/api/products/catalog',
        { params }
      );

      const { items, pagination } = response.data;

      const productosFormateados = items.map(producto => ({
        ...producto,
        precioVenta: formatearPrecio(producto.precioVenta)
      }));

      setProductos(prev =>
        initial ? productosFormateados : [...prev, ...productosFormateados]
      );

      setCursor(pagination.nextCursor || '');
      setHasNextPage(pagination.hasNextPage);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      // En caso de error, intentar usar datos locales
      aplicarFiltrosLocales();
    } finally {
      setIsLoading(false);
    }
  };

  const formatearPrecio = (precio) => {
    const numero = parseFloat(precio);
    return isNaN(numero) ? '0.00' : numero.toFixed(2);
  };

  // Generar sugerencias mejoradas con mejor lógica
  const generarSugerencias = useCallback((valor) => {
    if (!valor || valor.length < 2) {
      setSugerencias([]);
      return;
    }

    const valorLimpio = valor.toLowerCase().trim();
    const catalogoAUsar = catalogoCompleto ? todosCatalogo : productos;
    
    const sugerenciasFiltradas = catalogoAUsar
      .filter(producto => {
        const descripcion = producto.descripcion.toLowerCase();
        const codigo = producto.codigo?.toLowerCase() || '';
        
        // Mejorar coincidencias: palabras que empiecen con el término O que lo contengan
        return descripcion.includes(valorLimpio) || 
               codigo.includes(valorLimpio) ||
               descripcion.split(' ').some(palabra => palabra.startsWith(valorLimpio));
      })
      .slice(0, 10)
      .map(producto => ({
        value: producto.idArticulo,
        label: producto.descripcion
      }));
    
    setSugerencias(sugerenciasFiltradas);
  }, [productos, todosCatalogo, catalogoCompleto]);

  const handleBusquedaChange = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    
    // Generar sugerencias inmediatamente mientras escribe
    generarSugerencias(valor);
  };

  const handleRubroChange = (e) => {
    const valor = e.target.value;
    setFiltroRubro(String(valor));
  };

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
    hasNextPage: catalogoCompleto ? false : hasNextPage,
    isLoading,
    reiniciarFiltros,
    catalogoCompleto
  };
};

export default useCatalogo;