
import { Modal } from 'react-native';
import {
    useState,
    useEffect,
    useCallback
} from 'react';
import {
    Modal
} from 'react-native';
import React, {
    useState,
    useEffect,
    useCallback
} from 'react';
import {
    Check,
    Package,
    Send,
    X,
    Wifi,
    WifiOff,
    Calendar,
    Filter
} from 'lucide-react';
import {
    Link
} from 'react-router-dom';
import {
    useOrdenes
} from '../Hooks/useOrdenes';
import axios from 'axios';
import '../index.css';


const OrdersView = () => {
        const {
            ordenes,
            loading,
            cargarOrdenes,
            cargarOrdenesHoy,
            cargarOrdenesPorFecha, // Asegúrate de que esta función esté aquí
            enviarPedidoBackend,
            enviarTodosPendientes
        } = useOrdenes();

        const [showModal, setShowModal] = useState(false);
        const [selectedOrder, setSelectedOrder] = useState(null);
        const [isLoading, setIsLoading] = useState(false);
        const [alert, setAlert] = useState({
            show: false,
            type: '',
            message: ''
        });
        const [isConnected, setIsConnected] = useState(navigator.onLine);

        // Estados para filtros de fecha
        const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
        const [showDateFilter, setShowDateFilter] = useState(false);
        const [filterType, setFilterType] = useState('today'); // 'today', 'date', 'all'

        // NUEVOS ESTADOS PARA MODAL DE DETALLES - AGREGAR AQUÍ
        const [showDetailsModal, setShowDetailsModal] = useState(false);
        const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
        const [loadingDetails, setLoadingDetails] = useState(false);

      const baseURL = import.meta.env.VITE_BACKEND_URL; // Definir baseURL

        // Cargar órdenes al iniciar usando el hook
        useEffect(() => {
            cargarOrdenes();
        }, [cargarOrdenes]);

        // Escuchar cambios de conexión
        useEffect(() => {
            const handleOnline = () => setIsConnected(true);
            const handleOffline = () => setIsConnected(false);

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }, []);

        useEffect(() => {
            const loadOrdersForFilter = async () => {
                try {
                    if (filterType === 'today') {
                        await cargarOrdenesHoy();
                    } else if (filterType === 'date') {
                        await cargarOrdenesPorFecha(selectedDate);
                    } else if (filterType === 'all') {
                        await cargarOrdenes();
                    }
                } catch (error) {
                    console.error('Error loading orders:', error);
                }
            };

            loadOrdersForFilter();
        }, [filterType, selectedDate, cargarOrdenes, cargarOrdenesHoy, cargarOrdenesPorFecha]);

        const formatCurrency = useCallback((value) => {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            }).format(value || 0);
        }, []);


        const isToday = useCallback((dateString) => {
            try {
                const today = new Date();
                const orderDate = new Date(dateString);

                // Comparar en UTC para evitar problemas de zona horaria
                const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
                const utcOrderDate = Date.UTC(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());

                return utcToday === utcOrderDate;
            } catch (error) {
                console.error('Error en isToday:', error);
                return false;
            }
        }, []);


        const formatDate = useCallback((dateString) => {
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return 'Fecha inválida';

                return date.toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            } catch (error) {
                console.error('Error formateando fecha:', error);
                return 'Fecha inválida';
            }
        }, []);


        // Comparar solo año, mes y día en local

        // eslint-disable-next-line no-unused-vars
        const isSameDate = useCallback((dateString, compareDate) => {
            try {
                if (!dateString || !compareDate) return false;

                // Convertir ambas fechas a objetos Date
                const d1 = new Date(dateString);
                const d2 = new Date(compareDate);

                if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;

                // Ajustar ambas fechas a medianoche en la zona horaria local
                const d1Local = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
                const d2Local = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());

                return d1Local.getTime() === d2Local.getTime();
            } catch (error) {
                console.error('Error en isSameDate:', error);
                return false;
            }
        }, []);

        // Y en el useEffect de depuración, agregar:
        useEffect(() => {
            if (filterType === 'date') {
                console.log("=== INFORMACIÓN DE DEPURACIÓN AVANZADA ===");
                console.log("Fecha seleccionada:", selectedDate);
                console.log("Zona horaria del navegador:", Intl.DateTimeFormat().resolvedOptions().timeZone);
                console.log("Hora actual:", new Date().toString());

                // Mostrar información de las primeras 5 órdenes
                ordenes.slice(0, 5).forEach((orden, index) => {
                    console.log(`Orden ${index}:`, {
                        id: orden.id,
                        fechaAlta: orden.fechaAlta,
                        status: orden.status,
                        name: orden.name
                    });
                });
            }
        }, [filterType, selectedDate, ordenes]);

        useEffect(() => {
            console.log("🔍 Depuración - Verificando baseURL:", baseURL);
            console.log("🔍 Depuración - Token de autenticación:", localStorage.getItem('authToken'));

            // Verificar el estado de la conexión
            console.log("🔍 Depuración - Estado de conexión:", navigator.onLine);
        }, []);

        // Agrega este useEffect justo después de la definición de isSameDate
        useEffect(() => {
            if (filterType === 'date') {
                console.log("=== INFORMACIÓN COMPLETA ===");
                console.log("Fecha seleccionada:", selectedDate);
                console.log("Hora actual:", new Date().toString());
                console.log("Zona horaria:", Intl.DateTimeFormat().resolvedOptions().timeZone);
            }
        }, [filterType, selectedDate]);

        // NUEVAS FUNCIONES PARA MODAL DE DETALLES - AGREGAR AQUÍ
        const handleViewOrderDetails = useCallback(async (order) => {
            // Solo permitir en pedidos enviados
            if (order.status?.toLowerCase() !== 'enviado' && order.status?.toLowerCase() !== 'sent') {
                return;
            }

            setLoadingDetails(true);
            setShowDetailsModal(true);

            try {
                const response = await axios.get(`${baseURL}/api/pedidos/${order.idPedido || order.id}`, {
                    headers: {
                        "x-authentication": localStorage.getItem('authToken')
                    }
                });
                const data = response.data;

                // Normalizar nombres de campos para manejar diferentes formatos del API
                const normalizedData = {
                    ...data,

                    // Usar el campo correcto de la base de datos
                    fechaAlta: data.fechaPedido || data.fechPredIds || data['fechap@clio'] || data.fechaAlta,
                    clientName: data.clientName || data.name,
                    idPedido: data.idPedido || data.id,
                    total: data.total || data.value
                };

                setSelectedOrderDetails(normalizedData);
                console.log('Datos normalizados:', normalizedData);
            } catch (error) {
                console.error('Error cargando detalles:', error);
                setAlert({
                    show: true,
                    type: 'error',
                    message: 'Error al cargar los detalles del pedido'
                });
                setShowDetailsModal(false);
            } finally {
                setLoadingDetails(false);
            }
        }, [baseURL]);

        const closeDetailsModal = useCallback(() => {
            setShowDetailsModal(false);
            setSelectedOrderDetails(null);
        }, []);

        // Actualiza la función getFilteredOrders
        const getFilteredOrders = useCallback(() => {
            let filtered = [...ordenes];

            // Si no hay conexión, solo mostrar pendientes
            if (!isConnected) {
                filtered = filtered.filter(o => o.status?.toLowerCase() === 'pendiente');
            }

            // Aplicar filtros de fecha
            switch (filterType) {
                case 'today':
                    filtered = filtered.filter(o => {
                        if (o.status?.toLowerCase() === 'pendiente') return true;
                        return o.fechaPedido && isToday(o.fechaPedido);
                    });
                    break;

                case 'date':
                    // Para filtro por fecha específica, los pedidos ya fueron filtrados
                    // por cargarOrdenesPorFecha, así que no necesitamos filtrar aquí
                    // Solo mantenemos las órdenes tal como vienen del hook
                    break;
            }

            // Ordenar: pendientes primero, luego por ID descendente
            return filtered.sort((a, b) => {
                const aStatus = a.status?.toLowerCase();
                const bStatus = b.status?.toLowerCase();

                if (aStatus === 'pendiente' && bStatus !== 'pendiente') return -1;
                if (bStatus === 'pendiente' && aStatus !== 'pendiente') return 1;
                return (b.id || 0) - (a.id || 0);
            });
        }, [ordenes, isConnected, filterType, isToday]);

        useEffect(() => {
            if (ordenes.length > 0) {
                console.log("=== ANÁLISIS DE FECHAS EN ÓRDENES ===");
                ordenes.slice(0, 3).forEach((orden, index) => {
                    console.log(`Orden ${index + 1}:`, {
                        id: orden.id,
                        fechaAlta: orden.fechaAlta,
                        fechaAltaTipo: typeof orden.fechaAlta,
                        fechaAltaParseada: orden.fechaAlta ? new Date(orden.fechaAlta) : null,
                        fechaAltaFormateada: orden.fechaAlta ? formatDate(orden.fechaAlta) : null
                    });
                });
            }
        }, [ordenes, formatDate]);

        const dismissAlert = useCallback(() => {
            setAlert({
                show: false,
                type: '',
                message: ''
            });
        }, []);

        const handleSendOrder = useCallback((order) => {
            if (!isConnected) {
                setAlert({
                    show: true,
                    type: 'error',
                    message: 'No hay conexión a internet. Verifique su conexión e intente nuevamente.'
                });
                return;
            }
            setSelectedOrder(order);
            setShowModal(true);
        }, [isConnected]);

        const confirmSendOrder = useCallback(async () => {
            if (!selectedOrder) return;
            setIsLoading(true);
            try {
                const resultado = await enviarPedidoBackend(selectedOrder);
                const nuevoId = resultado.nuevoId || resultado.idPedido || selectedOrder.id;
                setAlert({
                    show: true,
                    type: 'success',
                    message: `✅ Pedido enviado exitosamente! Nuevo ID: #${nuevoId}`
                });
                await cargarOrdenes();
            } catch (error) {
                const errorMessage = error.message ?
                    `❌ ${error.message}` :
                    '❌ Error al enviar el pedido. Por favor, intente nuevamente.';
                setAlert({
                    show: true,
                    type: 'error',
                    message: errorMessage
                });
            } finally {
                setIsLoading(false);
                setShowModal(false);
                setSelectedOrder(null);
            }
        }, [selectedOrder, enviarPedidoBackend, cargarOrdenes]);

        const handleSendAllPending = useCallback(async () => {
            if (!isConnected) {
                setAlert({
                    show: true,
                    type: 'error',
                    message: 'No hay conexión a internet.'
                });
                return;
            }

            const confirmacion = window.confirm('¿Está seguro que desea enviar todos los pedidos pendientes?');
            if (!confirmacion) return;

            setIsLoading(true);
            try {
                const res = await enviarTodosPendientes();
                setAlert({
                    show: true,
                    type: res.errores > 0 ? 'warning' : 'success',
                    message: res.mensaje || 'Pedidos enviados correctamente'
                });
                await cargarOrdenes();
            } catch (err) {
                setAlert({
                    show: true,
                    type: 'error',
                    message: err.message || 'Error al enviar pedidos pendientes'
                });
            } finally {
                setIsLoading(false);
            }
        }, [isConnected, enviarTodosPendientes, cargarOrdenes]);

        // Obtener órdenes filtradas
        const todasOrdenes = getFilteredOrders();

        // Contadores basados en órdenes filtradas
        const ordenesPendientes = todasOrdenes.filter(o =>
            (o.status?.toLowerCase() === 'pendiente' ||
                o.status?.toLowerCase() === 'pending')
        );

        const ordenesEnviadas = todasOrdenes.filter(o =>
            (o.status?.toLowerCase() === 'enviado' ||
                o.status?.toLowerCase() === 'sent')
        );

        const handleFilterChange = (type) => {
            setFilterType(type);
            setShowDateFilter(false);
        };


        return ( < div className = "min-vh-100"
                style = {
                    {
                        backgroundColor: '#f7dc6f'
                    }
                } >
                < div className = "container-fluid px-2 px-md-4 py-3" >
                <div className = "row justify-content-center" >
                <div className = "col-12" >
                <div className = "card shadow-lg border-0"
                style = {
                    {
                        backgroundColor: '#f7dc6f',
                        borderRadius: '0',
                        minHeight: '100vh'
                    }
                } > {
                    /* HEADER MODIFICADO - Logo visible en todos los dispositivos */
                } <div className = "card-header py-2 py-md-3"
                style = {
                    {
                        backgroundColor: '#f7dc6f',
                        borderRadius: '15px 15px 0 0'
                    }
                } >
                <div className = "row align-items-center" > {
                    /* Logo - Visible en todos los dispositivos */
                } <div className = "col-auto" >
                <img src = "/logo-distruidora/logo.png"
                alt = "Distribuidora Esquina"
                className = "logo-img d-none d-md-block" // Visible en desktop/tablet
                style = {
                    {
                        maxHeight: '120px'
                    }
                }
                /> <img src = "/logo-distruidora/logo.png"
                alt = "Distribuidora Esquina"
                className = "d-md-none" // Visible en móvil
                style = {
                    {
                        maxHeight: '50px',
                        borderRadius: '8px'
                    }
                }
                /> </div >

                <div className = "col" >
                <
                h1 className = "mb-0 text-success fw-bold fs-6 fs-md-5" > Estados de órdenes < /h1> <
                div className = "row mt-2" >
                <
                div className = "col-auto" >
                <
                span className = "badge bg-warning text-dark me-2" >
                Pendientes: {
                    ordenesPendientes.length
                } <
                /span> < /
                div > <
                div className = "col-auto" >
                <
                span className = "badge bg-success" >
                Enviadas: {
                    ordenesEnviadas.length
                } <
                /span> < /
                div > <
                /div> < /
                div >

                <
                div className = "col-auto" >
                <
                div className = "d-flex align-items-center flex-nowrap" >
                <
                div className = {
                    `badge ${isConnected ? 'bg-success' : 'bg-danger'} me-3`
                } > {
                    isConnected ? '🟢 En línea' : '🔴 Sin conexión'
                } <
                /div>

                <
                div className = "d-flex align-items-center rounded-pill px-2 py-1 me-2"
                style = {
                    {
                        backgroundColor: '#298143'
                    }
                } >
                <
                span className = "me-1"
                style = {
                    {
                        fontSize: '0.9rem'
                    }
                } > 👤 < /span> <
                small className = "fw-semibold text-white"
                style = {
                    {
                        fontSize: '0.7rem'
                    }
                } >
                Cliente <
                /small> < /
                div >

                <
                div className = "rounded-circle overflow-hidden"
                style = {
                    {
                        width: '40px',
                        height: '40px'
                    }
                } >
                <
                img src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                alt = "Usuario"
                className = "w-100 h-100"
                style = {
                    {
                        objectFit: 'cover'
                    }
                }
                /> < /
                div > <
                /div> < /
                div > <
                /div> < /
                div >

                <
                div className = "card-body p-2 p-md-3 pb-5"
                style = {
                    {
                        paddingBottom: '120px'
                    }
                } > {
                    alert.show && ( <
                        div className = {
                            `alert alert-${alert.type === 'success' ? 'success' : alert.type === 'error' ? 'danger' : 'warning'} alert-dismissible fade show d-flex`
                        }
                        role = "alert"
                        style = {
                            {
                                maxWidth: '100%'
                            }
                        } >
                        <
                        div className = "d-flex align-items-center flex-grow-1" > {
                            alert.type === 'success' && < Check className = "me-2"
                            size = {
                                20
                            }
                            />} {
                            alert.type === 'error' && < X className = "me-2"
                            size = {
                                20
                            }
                            />} <
                            div className = "text-break"
                            style = {
                                {
                                    maxWidth: '85%'
                                }
                            } > {
                                alert.message
                            } <
                            /div> < /
                            div > <
                            button
                            type = "button"
                            className = "btn-close ms-2"
                            onClick = {
                                dismissAlert
                            }
                            aria - label = "Cerrar" >
                            <
                            /button> < /
                            div >
                        )
                    }


                    {
                        /* Filtros de Fecha */
                    } <
                    div className = "card mb-3 filtro-fecha-card" >
                    <
                    div className = "card-body p-3" >
                    <
                    div className = "d-flex flex-wrap align-items-center justify-content-between" >
                    <
                    div className = "d-flex align-items-center mb-2 mb-md-0" >
                    <
                    Calendar size = {
                        20
                    }
                    className = "text-warning me-2" / >
                    <
                    span className = "fw-semibold text-dark" > Filtrar por fecha: < /span> < /
                        div > <
                        div className = "d-flex flex-wrap gap-2" >
                        <
                        button className = {
                            `btn btn-sm ${filterType === 'today' ? 'btn-filtro-activo' : 'btn-filtro'}`
                        }
                    onClick = {
                        () => handleFilterChange('today')
                    } > 📅Hoy <
                    /button> {
                    /*  <button
                                                                        className={`btn btn-sm ${filterType === 'date' ? 'btn-filtro-activo' : 'btn-filtro'}`}
                                                                        onClick={() => setShowDateFilter(!showDateFilter)}
                                                                    >
                                                                        🗓️ Fecha específica
                                                                    </button> */
                } <
                button className = {
                    `btn btn-sm ${filterType === 'all' ? 'btn-filtro-activo' : 'btn-filtro'}`
                }
                onClick = {
                    () => handleFilterChange('all')
                } > 📋Todos <
                /button> < /
                div > <
                /div>

                {
                    showDateFilter && ( <
                        div className = "mt-3 pt-3 border-top" >
                        <
                        div className = "row align-items-center" >
                        <
                        div className = "col-auto" >
                        <
                        label className = "form-label mb-0" > Seleccionar fecha: < /label> < /
                        div > <
                        div className = "col-auto" >
                        <
                        input type = "date"
                        className = "form-control form-control-sm input-fecha"
                        value = {
                            selectedDate
                        }
                        onChange = {
                            (e) => {
                                setSelectedDate(e.target.value);
                                console.log('Fecha seleccionada:', e.target.value);
                            }
                        }
                        max = {
                            new Date().toISOString().split('T')[0]
                        }
                        /> < /
                        div > <
                        div className = "col-auto" >
                        <
                        button className = "btn btn-success btn-sm"
                        onClick = {
                            () => {
                                setFilterType('date');
                                setShowDateFilter(false);
                            }
                        } >
                        <
                        Filter size = {
                            14
                        }
                        className = "me-1" / >
                        Aplicar <
                        /button> < /
                        div > <
                        /div> < /
                        div >
                    )
                } <
                /div> < /
                div >


                <
                div className = "d-flex flex-wrap justify-content-between align-items-center mb-3" >
                <
                h6 className = "d-block d-md-none fw-bold text-success mb-0" > 📋PEDIDOS FILTRADOS < /h6> <
                h5 className = "d-none d-md-block fw-bold text-success mb-0" > 📋PEDIDOS FILTRADOS < /h5>

                {
                    ordenesPendientes.length > 0 && ( <
                        button className = "btn btn-success px-3 py-1"
                        onClick = {
                            handleSendAllPending
                        }
                        disabled = {
                            isLoading || !isConnected
                        }
                        style = {
                            {
                                fontSize: '0.875rem'
                            }
                        } > {
                            isLoading ? ( <
                                >
                                <
                                span className = "spinner-border spinner-border-sm me-2"
                                role = "status"
                                aria - hidden = "true" > < /span>
                                Enviando...
                                <
                                />
                            ) : ( <
                                >
                                <
                                Send size = {
                                    16
                                }
                                className = "me-1" / >
                                Enviar Todos({
                                    ordenesPendientes.length
                                }) <
                                />
                            )
                        } <
                        /button>
                    )
                } <
                /div>

                {
                    /* Vista móvil - MODIFICAR EL NOMBRE DEL CLIENTE */
                } <
                div className = "d-block d-md-none" > {
                    todasOrdenes.length > 0 ? (
                        todasOrdenes.map((order) => ( <
                                div key = {
                                    order.id
                                }
                                className = {
                                    `card mb-3 ${order.status === 'Pendiente' ? 'border-warning' : 'border-success'}`
                                }
                                style = {
                                    {
                                        borderRadius: '12px'
                                    }
                                } >
                                <
                                div className = "card-body p-3" > {
                                    /* Encabezado con ID y Estado */
                                } <
                                div className = "d-flex justify-content-between align-items-start mb-2" >
                                <
                                div >
                                <
                                h6 className = "mb-0 fw-bold text-primary" > # {
                                    order.id
                                } < /h6> {
                                order.fechaAlta && ( <
                                    small className = "text-muted" > 📅{
                                        formatDate(order.fechaAlta)
                                    } <
                                    /small>
                                )
                            } <
                            /div> <
                            span className = {
                                `badge px-2 py-1 ${order.status === 'Pendiente' ? 'bg-warning text-dark' : 'bg-success'}`
                            } > {
                                order.status
                            } <
                            /span> < /
                            div >

                            {
                                /* Información del cliente */
                            } <
                            div className = "mb-2" >
                            <
                            div className = "text-muted small" > Cliente: < /div> <
                            div className = {
                                `fw-semibold ${order.status === 'Enviado' ? 'text-primary' : ''}`
                            }
                            style = {
                                {
                                    cursor: order.status === 'Enviado' ? 'pointer' : 'default',
                                    textDecoration: order.status === 'Enviado' ? 'underline' : 'none'
                                }
                            }
                            onClick = {
                                () => order.status === 'Enviado' && handleViewOrderDetails(order)
                            }
                            title = {
                                order.status === 'Enviado' ? 'Ver detalles del pedido' : ''
                            } > {
                                order.name
                            } <
                            /div> < /
                            div >

                            {
                                /* Valor del pedido */
                            } <
                            div className = "mb-3" >
                            <
                            div className = "text-muted small" > Valor: < /div> <
                            div className = "fw-semibold text-success" > {
                                formatCurrency(order.value)
                            } < /div> < /
                            div >

                            {
                                /* Botón de acción */
                            } <
                            div className = "d-grid gap-2" > {
                                order.status === 'Pendiente' ? ( <
                                    button className = "btn btn-success btn-sm"
                                    onClick = {
                                        () => handleSendOrder(order)
                                    }
                                    disabled = {
                                        isLoading || !isConnected
                                    } >
                                    <
                                    Send size = {
                                        16
                                    }
                                    className = "me-1" / >
                                    Enviar <
                                    /button>
                                ) : ( <
                                    button className = "btn btn-outline-primary btn-sm"
                                    onClick = {
                                        () => handleViewOrderDetails(order)
                                    } >
                                    <
                                    Package size = {
                                        16
                                    }
                                    className = "me-1" / >
                                    Ver Detalles <
                                    /button>
                                )
                            } <
                            /div> < /
                            div > <
                            /div>
                        ))
                ): (
                    !loading && ( <
                        div className = "text-center py-5" >
                        <
                        Package size = {
                            64
                        }
                        className = "text-muted mb-3" / >
                        <
                        h5 className = "text-muted" > No hay órdenes para mostrar < /h5> <
                        p className = "text-muted" > {
                            filterType === 'today' ? 'No hay pedidos para el día de hoy.' : filterType === 'date' ? `No hay pedidos para la fecha ${selectedDate}.` : 'No hay pedidos disponibles.'
                        } {
                            filterType === 'date' && ( <
                                div className = "mt-2" >
                                <
                                small className = "text-info" > 💡Nota: Se muestran tanto pedidos enviados como pendientes para esta fecha. <
                                /small> < /
                                div >
                            )
                        } <
                        /p> <
                        Link to = "/pedido"
                        className = "btn btn-success" >
                        Crear nuevo pedido <
                        /Link> < /
                        div >
                    )
                )
            } <
            /div>

        {
            /* Vista desktop - MODIFICAR LA CELDA DEL NOMBRE */
        } <
        div className = "d-none d-md-block" > {
            todasOrdenes.length > 0 ? ( <
                div className = "table-responsive" >
                <
                table className = "table table-borderless" >
                <
                thead >
                <
                tr className = "text-muted" >
                <
                th > Código < /th> <
                th > Nombre < /th> <
                th > Valor < /th> <
                th > Fecha < /th> <
                th > Estado < /th> <
                th > Acciones < /th> < /
                tr > <
                /thead> <
                tbody > {
                    todasOrdenes.map((order) => ( <
                            tr key = {
                                order.id
                            }
                            className = {
                                order.status === 'Enviado' ? 'table-success' : ''
                            } >
                            <
                            td className = "fw-bold" > # {
                                order.idPedido || order.id
                            } < /td> {
                            /* CAMBIO PRINCIPAL - NOMBRE CLICKEABLE SOLO EN ENVIADOS */
                        } <
                        td >
                        <
                        span className = {
                            `${order.status === 'Enviado' ? 'text-primary' : ''}`
                        }
                        style = {
                            {
                                cursor: order.status === 'Enviado' ? 'pointer' : 'default',
                                textDecoration: order.status === 'Enviado' ? 'underline' : 'none'
                            }
                        }
                        onClick = {
                            () => order.status === 'Enviado' && handleViewOrderDetails(order)
                        }
                        title = {
                            order.status === 'Enviado' ? 'Ver detalles del pedido' : ''
                        } > {
                            order.name
                        } <
                        /span> < /
                        td > <
                        td > {
                            formatCurrency(order.value)
                        } < /td> <
                        td > {
                            order.fechaAlta ? ( <
                                small className = "text-muted" > {
                                    formatDate(order.fechaAlta)
                                } {
                                    isToday(order.fechaAlta) && ( <
                                        span className = "badge bg-info text-dark ms-1" > Hoy < /span>
                                    )
                                } <
                                /small>
                            ) : ( <
                                small className = "text-muted" > Sin fecha < /small>
                            )
                        } <
                        /td> <
                        td >
                        <
                        span className = {
                            `badge px-3 py-2 ${order.status === 'Pendiente' ? 'bg-warning text-dark' : 'bg-success'}`
                        } > {
                            order.status
                        } <
                        /span> < /
                        td > <
                        td > {
                            order.status === 'Pendiente' && ( <
                                button className = "btn btn-success btn-sm px-3"
                                onClick = {
                                    () => handleSendOrder(order)
                                }
                                disabled = {
                                    isLoading || !isConnected
                                } >
                                <
                                Send size = {
                                    16
                                }
                                className = "me-1" / >
                                Enviar <
                                /button>
                            )
                        } <
                        /td> < /
                        tr >
                    ))
            } <
            /tbody> < /
            table > <
            /div>
        ): (
            !loading && ( <
                div className = "text-center py-5" >
                <
                Package size = {
                    64
                }
                className = "text-muted mb-3" / >
                <
                h5 className = "text-muted" > No hay órdenes para mostrar < /h5> <
                p className = "text-muted" > {
                    filterType === 'today' ?
                    'No hay pedidos para el día de hoy.' : filterType === 'date' ?
                        `No hay pedidos para la fecha ${formatDate(selectedDate)}.` : 'No hay pedidos disponibles.'
                } {
                    filterType === 'date' && ( <
                        div className = "mt-2" >
                        <
                        small className = "text-info" > 💡Sugerencia: Verifica que la fecha esté en el formato correcto(AAAA - MM - DD) <
                        /small> < /
                        div >
                    )
                } <
                /p> <
                Link to = "/pedido"
                className = "btn btn-success" >
                Crear nuevo pedido <
                /Link> < /
                div >
            )
        )
    } <
    /div> < /
    div > <
    nav className = "fixed-bottom mb-4 bg-transparent" >
    <
    div className = "d-flex justify-content-around align-items-center" >
    <
    Link to = "/"
className = "btn btn-success d-flex align-items-center gap-2 px-4 py-2 shadow rounded-pill" > 📋 < span className = "nav-label" > Catálogo < /span>

    <
    /Link> <
Link to = '/pedido'
className = "btn btn-success d-flex align-items-center gap-2 px-4 py-2 shadow rounded-pill" > ➕ < span className = "fw-semibold text-white" > Pedido < /span> < /
    Link > <
    Link to = '/ordenes'
className = "btn btn-success d-flex align-items-center gap-2 px-4 py-2 shadow rounded-pill" > 📄 < span className = "fw-semibold text-white" > Órdenes < /span> < /
    Link > <
    /div> < /
    nav >

    <
    /div> < /
    div > <
    /div> < /
    div >

    {
        /* NUEVO MODAL DE DETALLES - AGREGAR ANTES DEL MODAL DE CONFIRMACIÓN */
    } <
    div className = {
        `modal fade ${showDetailsModal ? 'show' : ''}`
    }
style = {
    {
        display: showDetailsModal ? 'block' : 'none'
    }
}
tabIndex = "-1" >
    <
    div className = "modal-dialog modal-dialog-centered modal-lg" >
    <
    div className = "modal-content" >
    <
    div className = "modal-header" >
    <
    h5 className = "modal-title d-flex align-items-center" >
    <
    Package size = {
        20
    }
className = "me-2" / >
    Detalles del Pedido # {
        selectedOrderDetails?.idPedido || selectedOrderDetails?.id
    } <
    /h5> <
button type = "button"
className = "btn-close"
onClick = {
    closeDetailsModal
}
disabled = {
        loadingDetails
    } >
    <
    /button> < /
    div > <
    div className = "modal-body" > {
        loadingDetails ? ( <
            div className = "text-center py-4" >
            <
            div className = "spinner-border text-success"
            role = "status" >
            <
            span className = "visually-hidden" > Cargando detalles... < /span> < /
            div > <
            p className = "mt-2 text-muted" > Cargando información del pedido... < /p> < /
            div >
        ) : selectedOrderDetails ? ( <
            div className = "row" > {
                /* Información general */
            } <
            div className = "col-12 mb-4" >
            <
            div className = "card bg-light" >
            <
            div className = "card-body" >
            <
            h6 className = "card-title text-success mb-3" > Información General < /h6> <
            div className = "row" >
            <
            div className = "col-md-6 mb-2" >
            <
            strong > Cliente: < /strong> <
            div > {
                selectedOrderDetails.clientName
            } < /div> < /
            div > <
            div className = "col-md-6 mb-2" >
            <
            strong > Código: < /strong> <
            div > # {
                selectedOrderDetails.idPedido || selectedOrderDetails.id
            } < /div> < /
            div > <
            div className = "col-md-6 mb-2" >
            <
            strong > Fecha: < /strong> <
            div > {
                selectedOrderDetails.fechaAlta ?
                formatDate(selectedOrderDetails.fechaAlta) : 'Sin fecha'
            } <
            /div> < /
            div > <
            div className = "col-md-6 mb-2" >
            <
            strong > Total: < /strong> <
            div className = "text-success fw-bold" > {
                formatCurrency(selectedOrderDetails.total)
            } <
            /div> < /
            div > {
                selectedOrderDetails.observation &&
                selectedOrderDetails.observation.trim() !== "" &&
                selectedOrderDetails.observation.trim() !== "Sin observaciones" && ( <
                    div className = "col-12 mt-2" >
                    <
                    strong > Observaciones Generales: < /strong> <
                    div className = "bg-white p-2 rounded border" > {
                        selectedOrderDetails.observation
                    } <
                    /div> < /
                    div >
                )
            } <
            /div> < /
            div > <
            /div> < /
            div >

            {
                /* Productos */
            } <
            div className = "col-12" >
            <
            h6 className = "text-success mb-3" > Artículos < /h6> <
            div className = "table-responsive" >
            <
            table className = "table table-sm" >
            <
            thead className = "table-success" >
            <
            tr >
            <
            th > Artículo < /th> <
            th > Cantidad < /th> <
            th > Precio Unit. < /th> <
            th > Subtotal < /th> <
            th > Observaciones < /th> < /
            tr > <
            /thead> <
            tbody > {
                (selectedOrderDetails.productos || []).map((product, index) => ( <
                    tr key = {
                        index
                    } >
                    <
                    td className = "fw-semibold" >
                    <
                    div > {
                        product.descripcion || product.nombre || product.idArticulo
                    } < /div> <
                    small className = "text-muted" > Código: {
                        product.idArticulo
                    } < /small> < /
                    td > <
                    td > {
                        product.cantidad || 0
                    } < /td> <
                    td > {
                        formatCurrency(parseFloat(product.precio || 0))
                    } < /td> <
                    td className = "text-success" > {
                        formatCurrency((product.cantidad || 0) * parseFloat(product.precio || 0))
                    } <
                    /td> <
                    td > {
                        product.observation && product.observation.trim() !== "" ? ( <
                            small className = "text-muted" > {
                                product.observation
                            } <
                            /small>
                        ) : ( <
                            small className = "text-muted" > Sin observaciones < /small>
                        )
                    } <
                    /td> < /
                    tr >
                ))
            } <
            /tbody> < /
            table > <
            /div> < /
            div > <
            /div>
        ) : ( <
            div className = "text-center py-4" >
            <
            p className = "text-muted" > No se pudieron cargar los detalles del pedido. < /p> < /
            div >
        )
    } <
    /div> <
div className = "modal-footer" >
    <
    button type = "button"
className = "btn btn-secondary"
onClick = {
    closeDetailsModal
}
disabled = {
        loadingDetails
    } >
    Cerrar <
    /button> < /
    div > <
    /div> < /
    div > <
    /div>

{
    showDetailsModal && < div className = "modal-backdrop fade show" > < /div>}

    {
        /* Modal de confirmación - MANTENER EL MODAL EXISTENTE */
    } <
    div className = {
        `modal fade ${showModal ? 'show' : ''}`
    }
    style = {
        {
            display: showModal ? 'block' : 'none'
        }
    }
    tabIndex = "-1" >
        <
        div className = "modal-dialog modal-dialog-centered modal-sm" >
        <
        div className = "modal-content" >
        <
        div className = "modal-header" >
        <
        h6 className = "modal-title" > Confirmar envío < /h6> <
    button type = "button"
    className = "btn-close"
    onClick = {
            () => setShowModal(false)
        } > < /button> < /
        div > <
        div className = "modal-body" >
        <
        p className = "mb-2" > ¿Está seguro de que desea enviar el pedido # {
            selectedOrder?.id
        } ? < /p> <
    div className = "bg-light p-2 rounded" >
        <
        div className = "small" >
        <
        strong > Cliente: < /strong> {selectedOrder?.name}<br / >
        <
        strong > Valor: < /strong> {selectedOrder && formatCurrency(selectedOrder.value)} < /
        div > <
        /div> < /
        div > <
        div className = "modal-footer" >
        <
        button
    type = "button"
    className = "btn btn-secondary btn-sm"
    onClick = {
        () => setShowModal(false)
    }
    disabled = {
            isLoading
        } >
        Cancelar <
        /button> <
    button
    type = "button"
    className = "btn btn-success btn-sm"
    onClick = {
        confirmSendOrder
    }
    disabled = {
            isLoading
        } > {
            isLoading ? ( <
                >
                <
                span className = "spinner-border spinner-border-sm me-1"
                role = "status"
                aria - hidden = "true" > < /span>
                Enviando...
                <
                />
            ) : ( <
                >
                <
                Send size = {
                    14
                }
                className = "me-1" / >
                Confirmar <
                />
            )
        } <
        /button> < /
        div > <
        /div> < /
        div > <
        /div>

    {
        showModal && < div className = "modal-backdrop fade show" > < /div>}


            <
            /div>
    );
};

export default OrdersView;