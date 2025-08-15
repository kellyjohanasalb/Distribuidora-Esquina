/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useCatalogo = () => {
  // Estado inicial cargando desde localStorage para que sea inmediato
  const [productos, setProductos] = useState(() => {
    const guardado = localStorage.getItem("catalogo");
    return guardado ? JSON.parse(guardado) : [];
  });
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

  // Carga inicial: primero localStorage, luego API si hay internet
  useEffect(() => {
    if (navigator.onLine) {
      fetchRubros();
      fetchProductos(true);
    }
  }, []); // solo una vez al montar

  // Debounce para búsqueda y filtros
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const newTimer = setTimeout(() => {
      resetProductos();
    }, 300);
    setDebounceTimer(newTimer);

    return () => {
      if (newTimer) clearTimeout(newTimer);
    };
  }, [busqueda, filtroRubro]); // depende de los filtros

  // Obtener rubros de API o localStorage
  const fetchRubros = async () => {
    if (!navigator.onLine) return; // si offline, no hace nada
    try {
      const response = await axios.get('https://remito-send-back.vercel.app/api/rubros');
      setRubros(response.data);
      localStorage.setItem('rubros', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error al obtener rubros', error);
    }
  };

  // Reset de productos cuando cambian búsqueda o rubro
  const resetProductos = async () => {
    setProductos([]);
    setCursor('');
    setHasNextPage(true);
    await fetchProductos(true);
  };

  // Obtener productos (online u offline)
  const fetchProductos = async (initial = false) => {
    if (!navigator.onLine) {
      // Offline → cargar solo desde localStorage
      const guardado = localStorage.getItem('catalogo');
      if (guardado) {
        let productosGuardados = JSON.parse(guardado);

        // Filtrar localmente
        if (busqueda.trim().length >= 2) {
          productosGuardados = productosGuardados.filter(p =>
            p.descripcion.toLowerCase().includes(busqueda.toLowerCase())
          );
        }
        if (filtroRubro && !isNaN(Number(filtroRubro))) {
          productosGuardados = productosGuardados.filter(
            p => String(p.rubro) === String(filtroRubro)
          );
        }

        setProductos(productosGuardados);
        setHasNextPage(false);
      }
      return;
    }

    // Online → llamar API
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

      // Guardar catálogo completo en localStorage (para offline)
      const nuevosDatos = initial
        ? productosFormateados
        : [...productos, ...productosFormateados];

      localStorage.setItem('catalogo', JSON.stringify(nuevosDatos));

      setCursor(pagination.nextCursor || '');
      setHasNextPage(pagination.hasNextPage);
    } catch (error) {
      console.error('Error al obtener productos', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatearPrecio = (precio) => {
    const numero = parseFloat(precio);
    return isNaN(numero) ? '0.00' : numero.toFixed(2);
  };

  const generarSugerencias = useCallback((valor) => {
    if (!valor || valor.length < 2) {
      setSugerencias([]);
      return;
    }
    const valorLimpio = valor.toLowerCase().trim();
    const sugerenciasFiltradas = productos
      .filter(producto => producto.descripcion.toLowerCase().includes(valorLimpio))
      .slice(0, 8)
      .map(producto => ({
        value: producto.idArticulo,
        label: producto.descripcion
      }));
    setSugerencias(sugerenciasFiltradas);
  }, [productos]);

  const handleBusquedaChange = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
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
    hasNextPage,
    isLoading,
    reiniciarFiltros
  };
};

export default useCatalogo;
