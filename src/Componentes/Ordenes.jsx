import React, { useState, useEffect, useCallback } from 'react';
import { Check, Package, Send, X, Wifi, WifiOff, Calendar, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOrdenes } from '../Hooks/useOrdenes';
import axios from 'axios'; // Asegurar que axios esté importado
import '../index.css';


const OrdersView = () => {
    const {
        ordenes,
        loading,
        cargarOrdenes,
        enviarPedidoBackend,
        enviarTodosPendientes
    } = useOrdenes();

    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
    const [isConnected, setIsConnected] = useState(navigator.onLine);

    // Estados para filtros de fecha
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [filterType, setFilterType] = useState('today'); // 'today', 'date', 'all'

    // NUEVOS ESTADOS PARA MODAL DE DETALLES - AGREGAR AQUÍ
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const baseURL = "https://remito-send-back.vercel.app"; // Definir baseURL

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

    const formatCurrency = useCallback((value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value || 0);
    }, []);

    const formatDate = useCallback((dateString) => {
        try {
            // El formato ISO con 'Z' al final es válido para el constructor Date
            const date = new Date(dateString);
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

    const isToday = useCallback((dateString) => {
        const today = new Date().toDateString();
        const orderDate = new Date(dateString).toDateString();
        return today === orderDate;
    }, []);

    const isSameDate = useCallback((dateString, compareDate) => {
        const date1 = new Date(dateString).toDateString();
        const date2 = new Date(compareDate).toDateString();
        return date1 === date2;
    }, []);

    // NUEVAS FUNCIONES PARA MODAL DE DETALLES - AGREGAR AQUÍ
    const handleViewOrderDetails = useCallback(async (order) => {
        // Solo permitir en pedidos enviados
        if (order.status?.toLowerCase() !== 'enviado' && order.status?.toLowerCase() !== 'sent') {
            return;
        }

        setLoadingDetails(true);
        setShowDetailsModal(true);

        try {
            const response = await axios.get(`${baseURL}/api/pedidos/${order.idPedido || order.id}`);
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

    // Función para filtrar órdenes por fecha
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
                    // Pendientes siempre se muestran
                    if (o.status?.toLowerCase() === 'pendiente') return true;
                    // Enviados solo si son de hoy
                    return o.fechaAlta && isToday(o.fechaAlta);
                });
                break;
            case 'date':
                filtered = filtered.filter(o => {
                    // Pendientes siempre se muestran
                    if (o.status?.toLowerCase() === 'pendiente') return true;
                    // Enviados solo si son de la fecha seleccionada
                    return o.fechaAlta && isSameDate(o.fechaAlta, selectedDate);
                });
                break;
            case 'all':
                // Mostrar todo (ya filtrado por conexión arriba)
                break;
            default:
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
    }, [ordenes, isConnected, filterType, selectedDate, isToday, isSameDate]);

    const dismissAlert = useCallback(() => {
        setAlert({ show: false, type: '', message: '' });
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
            const errorMessage = error.message
                ? `❌ ${error.message}`
                : '❌ Error al enviar el pedido. Por favor, intente nuevamente.';
            setAlert({ show: true, type: 'error', message: errorMessage });
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

    if (loading && ordenes.length === 0) {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#f7dc6f' }}>
                <div className="text-center">
                    <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-2 text-success fw-semibold">Cargando órdenes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100" style={{ backgroundColor: '#f7dc6f' }}>
            <div className="container-fluid px-2 px-md-4 py-3">
                <div className="row justify-content-center">
                    <div className="col-12">
                        <div
                            className="card shadow-lg border-0"
                            style={{
                                backgroundColor: '#f7dc6f',
                                borderRadius: '0',
                                minHeight: '100vh'
                            }}
                        >
                            <div className="card-header py-2 py-md-3" style={{ backgroundColor: '#f7dc6f', borderRadius: '15px 15px 0 0' }}>
                                <div className="row align-items-center">
                                    <div className="col-auto d-none d-sm-block">
                                        <img
                                            src="/logo-distruidora/logo.png"
                                            alt="Distribuidora Esquina"
                                            className="logo-img"
                                            style={{ width: '120px', height: '120px' }}
                                        />
                                    </div>
                                    <div className="col">
                                        <h1 className="mb-0 text-success fw-bold fs-6 fs-md-5">Estados de órdenes</h1>
                                        <div className="row mt-2">
                                            <div className="col-auto">
                                                <span className="badge bg-warning text-dark me-2">
                                                    Pendientes: {ordenesPendientes.length}
                                                </span>
                                            </div>
                                            <div className="col-auto">
                                                <span className="badge bg-success">
                                                    Enviadas: {ordenesEnviadas.length}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <div className="d-flex align-items-center">
                                            <div className={`badge ${isConnected ? 'bg-success' : 'bg-danger'} me-3`}>
                                                {isConnected ? '🟢 En línea' : '🔴 Sin conexión'}
                                            </div>

                                            <div
                                                className="d-flex align-items-center rounded-pill px-3 py-1 me-3"
                                                style={{ backgroundColor: '#298143' }}
                                            >
                                                <span className="me-2" style={{ fontSize: '1.2rem' }}>👤</span>
                                                <small className="fw-semibold text-white">Cliente</small>
                                            </div>

                                            <div
                                                className="rounded-circle overflow-hidden"
                                                style={{ width: '40px', height: '40px' }}
                                            >
                                                <img
                                                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                                                    alt="Usuario"
                                                    className="w-100 h-100"
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card-body p-2 p-md-3 pb-5" style={{ paddingBottom: '120px' }}>
                                {alert.show && (
                                    <div
                                        className={`alert alert-${alert.type === 'success' ? 'success' : alert.type === 'error' ? 'danger' : 'warning'} alert-dismissible fade show d-flex`}
                                        role="alert"
                                        style={{ maxWidth: '100%' }}
                                    >
                                        <div className="d-flex align-items-center flex-grow-1">
                                            {alert.type === 'success' && <Check className="me-2" size={20} />}
                                            {alert.type === 'error' && <X className="me-2" size={20} />}
                                            <div className="text-break" style={{ maxWidth: '85%' }}>
                                                {alert.message}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-close ms-2"
                                            onClick={dismissAlert}
                                            aria-label="Cerrar"
                                        ></button>
                                    </div>
                                )}

                                {/* Filtros de Fecha */}
                                <div className="card mb-3" style={{ backgroundColor: '#fff3cd' }}>
                                    <div className="card-body p-3">
                                        <div className="d-flex flex-wrap align-items-center justify-content-between">
                                            <div className="d-flex align-items-center mb-2 mb-md-0">
                                                <Calendar size={20} className="text-warning me-2" />
                                                <span className="fw-semibold text-dark">Filtrar por fecha:</span>
                                            </div>
                                            <div className="d-flex flex-wrap gap-2">
                                                <button
                                                    className={`btn btn-sm ${filterType === 'today' ? 'btn-warning' : 'btn-outline-warning'}`}
                                                    onClick={() => handleFilterChange('today')}
                                                >
                                                    📅 Hoy
                                                </button>
                                                <button
                                                    className={`btn btn-sm ${filterType === 'date' ? 'btn-warning' : 'btn-outline-warning'}`}
                                                    onClick={() => setShowDateFilter(!showDateFilter)}
                                                >
                                                    🗓️ Fecha específica
                                                </button>
                                                <button
                                                    className={`btn btn-sm ${filterType === 'all' ? 'btn-warning' : 'btn-outline-warning'}`}
                                                    onClick={() => handleFilterChange('all')}
                                                >
                                                    📋 Todos
                                                </button>
                                            </div>
                                        </div>

                                        {showDateFilter && (
                                            <div className="mt-3 pt-3 border-top">
                                                <div className="row align-items-center">
                                                    <div className="col-auto">
                                                        <label className="form-label mb-0">Seleccionar fecha:</label>
                                                    </div>
                                                    <div className="col-auto">
                                                        <input
                                                            type="date"
                                                            className="form-control form-control-sm"
                                                            value={selectedDate}
                                                            onChange={(e) => setSelectedDate(e.target.value)}
                                                            max={new Date().toISOString().split('T')[0]}
                                                        />
                                                    </div>
                                                    <div className="col-auto">
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => handleFilterChange('date')}
                                                        >
                                                            <Filter size={14} className="me-1" />
                                                            Aplicar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                                    <h6 className="d-block d-md-none fw-bold text-success mb-0">📋 PEDIDOS FILTRADOS</h6>
                                    <h5 className="d-none d-md-block fw-bold text-success mb-0">📋 PEDIDOS FILTRADOS</h5>

                                    {ordenesPendientes.length > 0 && (
                                        <button
                                            className="btn btn-success px-3 py-1"
                                            onClick={handleSendAllPending}
                                            disabled={isLoading || !isConnected}
                                            style={{ fontSize: '0.875rem' }}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={16} className="me-1" />
                                                    Enviar Todos ({ordenesPendientes.length})
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Vista móvil - MODIFICAR EL NOMBRE DEL CLIENTE */}
                                <div className="d-block d-md-none">
                                    {todasOrdenes.length > 0 ? (
                                        todasOrdenes.map((order) => (
                                            <div
                                                key={order.id}
                                                className={`card mb-3 ${order.status === 'Pendiente' ? 'border-warning' : 'border-success bg-light'}`}
                                            >
                                                <div className="card-body p-3">
                                                    <div className="row align-items-center">
                                                        <div className="col-12 mb-2">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <h6 className="mb-0 fw-bold text-primary">#{order.id}</h6>
                                                                <span className={`badge px-2 py-1 ${order.status === 'Pendiente' ? 'bg-warning text-dark' : 'bg-success'}`}>
                                                                    {order.status}
                                                                </span>
                                                            </div>
                                                            {order.fechaAlta && (
                                                                <small className="text-muted">
                                                                    📅 {formatDate(order.fechaAlta)}
                                                                </small>
                                                            )}
                                                        </div>
                                                        <div className="col-12 mb-2">
                                                            <div className="text-muted small">Cliente:</div>
                                                            {/* CAMBIO PRINCIPAL - NOMBRE CLICKEABLE SOLO EN ENVIADOS */}
                                                            <div
                                                                className={`fw-semibold ${order.status === 'Enviado' ? 'text-primary' : ''}`}
                                                                style={{
                                                                    cursor: order.status === 'Enviado' ? 'pointer' : 'default',
                                                                    textDecoration: order.status === 'Enviado' ? 'underline' : 'none'
                                                                }}
                                                                onClick={() => order.status === 'Enviado' && handleViewOrderDetails(order)}
                                                                title={order.status === 'Enviado' ? 'Ver detalles del pedido' : ''}
                                                            >
                                                                {order.name}
                                                            </div>
                                                        </div>
                                                        <div className="col-12 mb-2">
                                                            <div className="text-muted small">Valor:</div>
                                                            <div className="fw-semibold text-success">{formatCurrency(order.value)}</div>
                                                        </div>
                                                        <div className="col-12">
                                                            {order.status === 'Pendiente' && (
                                                                <button
                                                                    className="btn btn-success btn-sm w-100"
                                                                    onClick={() => handleSendOrder(order)}
                                                                    disabled={isLoading || !isConnected}
                                                                >
                                                                    <Send size={16} className="me-1" />
                                                                    Enviar
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        !loading && (
                                            <div className="text-center py-5">
                                                <Package size={64} className="text-muted mb-3" />
                                                <h5 className="text-muted">No hay órdenes para mostrar</h5>
                                                <p className="text-muted">
                                                    {filterType === 'today' ? 'No hay pedidos para el día de hoy.' :
                                                        filterType === 'date' ? `No hay pedidos para el ${formatDate(selectedDate)}.` :
                                                            'No hay pedidos disponibles.'}
                                                </p>
                                                <Link to="/pedido" className="btn btn-success">
                                                    Crear nuevo pedido
                                                </Link>
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Vista desktop - MODIFICAR LA CELDA DEL NOMBRE */}
                                <div className="d-none d-md-block">
                                    {todasOrdenes.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-borderless">
                                                <thead>
                                                    <tr className="text-muted">
                                                        <th>Código</th>
                                                        <th>Nombre</th>
                                                        <th>Valor</th>
                                                        <th>Fecha</th>
                                                        <th>Estado</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {todasOrdenes.map((order) => (
                                                        <tr
                                                            key={order.id}
                                                            className={order.status === 'Enviado' ? 'table-success' : ''}
                                                        >
                                                            <td className="fw-bold">#{order.idPedido || order.id}</td>
                                                            {/* CAMBIO PRINCIPAL - NOMBRE CLICKEABLE SOLO EN ENVIADOS */}
                                                            <td>
                                                                <span
                                                                    className={`${order.status === 'Enviado' ? 'text-primary' : ''}`}
                                                                    style={{
                                                                        cursor: order.status === 'Enviado' ? 'pointer' : 'default',
                                                                        textDecoration: order.status === 'Enviado' ? 'underline' : 'none'
                                                                    }}
                                                                    onClick={() => order.status === 'Enviado' && handleViewOrderDetails(order)}
                                                                    title={order.status === 'Enviado' ? 'Ver detalles del pedido' : ''}
                                                                >
                                                                    {order.name}
                                                                </span>
                                                            </td>
                                                            <td>{formatCurrency(order.value)}</td>
                                                            <td>
                                                                {order.fechaAlta ? (
                                                                    <small className="text-muted">
                                                                        {formatDate(order.fechaAlta)}
                                                                        {isToday(order.fechaAlta) && (
                                                                            <span className="badge bg-info text-dark ms-1">Hoy</span>
                                                                        )}
                                                                    </small>
                                                                ) : (
                                                                    <small className="text-muted">Sin fecha</small>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className={`badge px-3 py-2 ${order.status === 'Pendiente' ? 'bg-warning text-dark' : 'bg-success'}`}>
                                                                    {order.status}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {order.status === 'Pendiente' && (
                                                                    <button
                                                                        className="btn btn-success btn-sm px-3"
                                                                        onClick={() => handleSendOrder(order)}
                                                                        disabled={isLoading || !isConnected}
                                                                    >
                                                                        <Send size={16} className="me-1" />
                                                                        Enviar
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        !loading && (
                                            <div className="text-center py-5">
                                                <Package size={64} className="text-muted mb-3" />
                                                <h5 className="text-muted">No hay órdenes para mostrar</h5>
                                                <p className="text-muted">
                                                    {filterType === 'today' ? 'No hay pedidos para el día de hoy.' :
                                                        filterType === 'date' ? `No hay pedidos para el ${formatDate(selectedDate)}.` :
                                                            'No hay pedidos disponibles.'}
                                                </p>
                                                <Link to="/pedido" className="btn btn-success">
                                                    Crear nuevo pedido
                                                </Link>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            <nav className="fixed-bottom" style={{ zIndex: 100, marginBottom: '15px' }}>
  <div className="d-flex justify-content-around align-items-center">

    {/* Catálogo */}
    <Link to="/" className="btn btn-success d-flex align-items-center gap-1 px-3 py-2 shadow rounded-pill">
      🛒 
      {/* Texto mobile más pequeño */}
      <span className="nav-label">Catálogo</span>

      {/* Texto tablet/desktop normal */}
      <span className="d-none d-md-inline fw-semibold text-white">Catálogo</span>
    </Link>

    {/* Pedido */}
    <Link to="/pedido" className="btn btn-success d-flex align-items-center gap-1 px-3 py-2 shadow rounded-pill">
      ➕ 
      <span className="d-inline d-md-none fw-semibold text-white" style={{ fontSize: "0.75rem" }}>Pedido</span>
      <span className="d-none d-md-inline fw-semibold text-white">Pedido</span>
    </Link>

    {/* Órdenes */}
    <Link to='/ordenes' className="btn btn-success d-flex align-items-center gap-1 px-3 py-2 shadow rounded-pill">
      📄 
      <span className="d-inline d-md-none fw-semibold text-white" style={{ fontSize: "0.75rem" }}>Órdenes</span>
      <span className="d-none d-md-inline fw-semibold text-white">Órdenes</span>
    </Link>

  </div>
</nav>

                        </div>
                    </div>
                </div>
            </div>

            {/* NUEVO MODAL DE DETALLES - AGREGAR ANTES DEL MODAL DE CONFIRMACIÓN */}
            <div className={`modal fade ${showDetailsModal ? 'show' : ''}`}
                style={{ display: showDetailsModal ? 'block' : 'none' }}
                tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title d-flex align-items-center">
                                <Package size={20} className="me-2" />
                                Detalles del Pedido #{selectedOrderDetails?.idPedido || selectedOrderDetails?.id}
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={closeDetailsModal}
                                disabled={loadingDetails}
                            ></button>
                        </div>
                        <div className="modal-body">
                            {loadingDetails ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-success" role="status">
                                        <span className="visually-hidden">Cargando detalles...</span>
                                    </div>
                                    <p className="mt-2 text-muted">Cargando información del pedido...</p>
                                </div>
                            ) : selectedOrderDetails ? (
                                <div className="row">
                                    {/* Información general */}
                                    <div className="col-12 mb-4">
                                        <div className="card bg-light">
                                            <div className="card-body">
                                                <h6 className="card-title text-success mb-3">Información General</h6>
                                                <div className="row">
                                                    <div className="col-md-6 mb-2">
                                                        <strong>Cliente:</strong>
                                                        <div>{selectedOrderDetails.clientName}</div>
                                                    </div>
                                                    <div className="col-md-6 mb-2">
                                                        <strong>Código:</strong>
                                                        <div>#{selectedOrderDetails.idPedido || selectedOrderDetails.id}</div>
                                                    </div>
                                                    <div className="col-md-6 mb-2">
                                                        <strong>Fecha:</strong>
                                                        <div>
                                                            {selectedOrderDetails.fechaAlta ?
                                                                formatDate(selectedOrderDetails.fechaAlta) :
                                                                'Sin fecha'
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6 mb-2">
                                                        <strong>Total:</strong>
                                                        <div className="text-success fw-bold">
                                                            {formatCurrency(selectedOrderDetails.total)}
                                                        </div>
                                                    </div>
                                                    {selectedOrderDetails.observation &&
                                                        selectedOrderDetails.observation.trim() !== "" &&
                                                        selectedOrderDetails.observation.trim() !== "Sin observaciones" && (
                                                            <div className="col-12 mt-2">
                                                                <strong>Observaciones Generales:</strong>
                                                                <div className="bg-white p-2 rounded border">
                                                                    {selectedOrderDetails.observation}
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Productos */}
                                    <div className="col-12">
                                        <h6 className="text-success mb-3">Artículos</h6>
                                        <div className="table-responsive">
                                            <table className="table table-sm">
                                                <thead className="table-success">
                                                    <tr>
                                                        <th>Artículo</th>
                                                        <th>Cantidad</th>
                                                        <th>Precio Unit.</th>
                                                        <th>Subtotal</th>
                                                        <th>Observaciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(selectedOrderDetails.productos || []).map((product, index) => (
                                                        <tr key={index}>
                                                            <td className="fw-semibold">
                                                                <div>{product.descripcion || product.nombre || product.idArticulo}</div>
                                                                <small className="text-muted">Código: {product.idArticulo}</small>
                                                            </td>
                                                            <td>{product.cantidad || 0}</td>
                                                            <td>{formatCurrency(parseFloat(product.precio || 0))}</td>
                                                            <td className="text-success">
                                                                {formatCurrency((product.cantidad || 0) * parseFloat(product.precio || 0))}
                                                            </td>
                                                            <td>
                                                                {product.observation &&
                                                                    product.observation.trim() !== "" ? (
                                                                    <small className="text-muted">
                                                                        {product.observation}
                                                                    </small>
                                                                ) : (
                                                                    <small className="text-muted">Sin observaciones</small>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-muted">No se pudieron cargar los detalles del pedido.</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={closeDetailsModal}
                                disabled={loadingDetails}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showDetailsModal && <div className="modal-backdrop fade show"></div>}

            {/* Modal de confirmación - MANTENER EL MODAL EXISTENTE */}
            <div className={`modal fade ${showModal ? 'show' : ''}`} style={{ display: showModal ? 'block' : 'none' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-sm">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h6 className="modal-title">Confirmar envío</h6>
                            <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                        </div>
                        <div className="modal-body">
                            <p className="mb-2">¿Está seguro de que desea enviar el pedido #{selectedOrder?.id}?</p>
                            <div className="bg-light p-2 rounded">
                                <div className="small">
                                    <strong>Cliente:</strong> {selectedOrder?.name}<br />
                                    <strong>Valor:</strong> {selectedOrder && formatCurrency(selectedOrder.value)}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setShowModal(false)}
                                disabled={isLoading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={confirmSendOrder}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send size={14} className="me-1" />
                                        Confirmar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && <div className="modal-backdrop fade show"></div>}

            {/* Botón de simulación de conexión - MANTENER EL EXISTENTE */}
            <div className="position-fixed" style={{ bottom: '100px', right: '15px', zIndex: 1000 }}>
                <button
                    className={`btn btn-sm ${isConnected ? 'btn-success' : 'btn-danger'}`}
                    onClick={() => setIsConnected(!isConnected)}
                    style={{ width: '40px', height: '40px' }}
                    title={isConnected ? 'Simular desconexión' : 'Simular conexión'}
                >
                    {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                </button>
            </div>
        </div>
    );
};

export default OrdersView;