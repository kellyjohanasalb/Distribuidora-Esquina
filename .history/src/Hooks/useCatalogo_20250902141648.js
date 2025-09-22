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
  const [isLoading, setIsLoading] = useState(false);
  const [sugerencias, setSugerencias] = useState([]);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [catalogoCompleto, setCatalogoCompleto] = useState(false);

  // Carga inicial
  useEffect(() => {
    if (navigator.onLine) {
      fetchRubros();
      cargarTodosCatalogo(); // Nuevo método que usa /api/products/all
    } else {
      // Modo offline: aplicar filtros a datos locales
      aplicarFiltrosLocales();
    }
  }, []);

  // Debounce para búsqueda, filtro de rubro es inmediato
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    
    const newTimer = setTimeout(() => {
      aplicarFiltrosLocales();
    }, busqueda.length >= 2 ? 300 : 0);
    
    setDebounceTimer(newTimer);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [busqueda, filtroRubro]);

  // NUEVO: Cargar todo el catálogo de una vez usando /api/products/all
  const cargarTodosCatalogo = async () => {
    if (!navigator.onLine) return;
    
    setIsLoading(true);

    try {
      const response = await axios.get('https://remito-send-back.vercel.app/api/products/all');
      
      const productosFormateados = response.data.map(producto => ({
        ...producto,
        precioVenta: formatearPrecio(producto.precioVenta)
      }));

      // Guardar catálogo completo en localStorage
      localStorage.setItem('catalogoCompleto', JSON.stringify(productosFormateados));
      setTodosCatalogo(productosFormateados);
      setCatalogoCompleto(true);

      // Aplicar filtros iniciales
      aplicarFiltrosLocales(productosFormateados);

    } catch (error) {
      console.error('Error al cargar catálogo completo:', error);
      // Fallback: intentar usar datos guardados localmente
      if (todosCatalogo.length > 0) {
        aplicarFiltrosLocales();
      }
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
    } else if (busqueda.trim().length > 0 && busqueda.trim().length < 2) {
      // Si hay 1 carácter, no mostrar productos aún
      if (!filtroRubro) {
        productosFiltrados = [];
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

  const formatearPrecio = (precio) => {
    const numero = parseFloat(precio);
    return isNaN(numero) ? '0.00' : numero.toFixed(2);
  };

  // Generar sugerencias mejoradas
  const generarSugerencias = useCallback((valor) => {
    if (!valor || valor.length < 2) {
      setSugerencias([]);
      return;
    }

    const valorLimpio = valor.toLowerCase().trim();
    
    const sugerenciasFiltradas = todosCatalogo
      .filter(producto => {
        const descripcion = producto.descripcion.toLowerCase();
        const codigo = producto.codigo?.toLowerCase() || '';
        
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
  }, [todosCatalogo]);

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

  // NUEVO: Función para scroll al top
  const scrollAlTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  fetchProductos: cargarTodosCatalogo,
  hasNextPage: false,
  isLoading,
  reiniciarFiltros,
  catalogoCompleto,
  scrollAlTop,
  todosCatalogo // 👈 nuevo
};
};

export default useCatalogo;