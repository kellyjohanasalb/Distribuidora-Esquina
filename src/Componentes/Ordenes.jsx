import React, { useState, useEffect } from 'react';
import { Check, Package, Send, X, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOrdenes } from '../Hooks/useOrdenes';
import '../index.css';

const OrdersView = () => {
    const {
        ordenes,
        loading,
        error,
        cargarOrdenes,
        enviarPedidoBackend,
        enviarTodosPendientes
    } = useOrdenes();

    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
    const [isConnected, setIsConnected] = useState(navigator.onLine);

    // Detectar cambios en la conexión
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

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value || 0);
    };

    // FUNCIÓN PARA ENVIAR PEDIDO INDIVIDUAL
  const handleSendOrder = (order) => {
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
    };

    // CONFIRMAR ENVÍO DE PEDIDO INDIVIDUAL
    const confirmSendOrder = async () => {
        if (!selectedOrder) return;

        setIsLoading(true);

        try {
            const { nuevoId } = await enviarPedidoBackend(selectedOrder);

            setAlert({
                show: true,
                type: 'success',
                message: `✅ Pedido enviado exitosamente! Nuevo ID: #${nuevoId}`
            });

            await cargarOrdenes();

        } catch (error) {
            // Mensajes de error en español
            let errorMessage = '❌ Error al enviar el pedido. Por favor, intente nuevamente.';
            
            if (error.message.includes("Failed to fetch") || error.message.includes("Network Error")) {
                errorMessage = '❌ Error de conexión con el servidor. Verifique su conexión a internet.';
            } else if (error.message.includes("validation") || error.message.includes("invalid")) {
                errorMessage = '❌ Los datos del pedido son inválidos. Revise la información.';
            } else if (error.message.includes("timeout")) {
                errorMessage = '❌ El servidor tardó demasiado en responder. Intente nuevamente.';
            } else if (error.message.includes("401") || error.message.includes("unauthorized")) {
                errorMessage = '❌ No tiene permisos para realizar esta acción.';
            } else if (error.message.includes("500")) {
                errorMessage = '❌ Error interno del servidor. Contacte al administrador.';
            } else if (error.message) {
                errorMessage = `❌ ${error.message}`;
            }

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
    };

    // FUNCIÓN PARA ENVIAR TODOS LOS PENDIENTES
    const handleSendAllPending = async () => {
        if (!isConnected) {
            setAlert({
                show: true,
                type: 'error',
                message: 'No hay conexión a internet. Verifique su conexión e intente nuevamente.'
            });
            return;
        }

        const pendingOrders = ordenes.filter(order => order.status === 'Pendiente');

        if (pendingOrders.length === 0) {
            setAlert({
                show: true,
                type: 'warning',
                message: 'No hay pedidos pendientes para enviar'
            });
            return;
        }

        const confirmacion = window.confirm(
            `¿Está seguro que desea enviar todos los pedidos pendientes?\n\n` +
            `Se enviarán ${pendingOrders.length} pedidos al servidor.\n` +
            `Esta acción no se puede deshacer.`
        );

        if (!confirmacion) return;

        setIsLoading(true);

        try {
            const resultado = await enviarTodosPendientes();

            setAlert({
                show: true,
                type: resultado.errores > 0 ? 'warning' : 'success',
                message: resultado.mensaje
            });

            await cargarOrdenes();

        } catch (error) {
            // Mensajes de error MEJORADOS y en español
            let errorMessage = 'Error al enviar el pedido. Por favor, intente nuevamente.';
            
            if (error.message.includes("Failed to fetch") || error.message.includes("Network Error")) {
                errorMessage = 'Error de conexión con el servidor. Verifique su conexión a internet.';
            } else if (error.message.includes("validation") || error.message.includes("invalid")) {
                errorMessage = 'Los datos del pedido son inválidos. Revise la información.';
            } else if (error.message.includes("timeout")) {
                errorMessage = 'El servidor tardó demasiado en responder. Intente nuevamente.';
            } else if (error.message.includes("401") || error.message.includes("unauthorized")) {
                errorMessage = 'No tiene permisos para realizar esta acción.';
            } else if (error.message.includes("500")) {
                errorMessage = 'Error interno del servidor. Contacte al administrador.';
            }

            setAlert({
                show: true,
                type: 'error',
                message: `❌ ${errorMessage}`
            });
        } finally {
            setIsLoading(false);
        }
    };

    const dismissAlert = () => {
        setAlert({ show: false, type: '', message: '' });
    };

    // Separar órdenes por estado para contadores
    const ordenesPendientes = ordenes.filter(o => o.status === 'Pendiente');
    const ordenesEnviadas = ordenes.filter(o => o.status === 'Enviado');

    // Ordenar todas las órdenes: pendientes primero, luego enviadas, y dentro de cada grupo por id descendente
    const todasOrdenes = [...ordenes].sort((a, b) => {
        if (a.status === 'Pendiente' && b.status !== 'Pendiente') return -1;
        if (a.status !== 'Pendiente' && b.status === 'Pendiente') return 1;
        return b.id - a.id;
    });

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
                                            className="me-3 rounded shadow"
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
                                            {/* Estado de conexión */}
                                            <div className={`badge ${isConnected ? 'bg-success' : 'bg-danger'} me-3`}>
                                                {isConnected ? '🟢 En línea' : '🔴 Sin conexión'}
                                            </div>

                                            {/* CLIENTE */}
                                            <div
                                                className="d-flex align-items-center rounded-pill px-3 py-1 me-3"
                                                style={{ backgroundColor: '#298143' }}
                                            >
                                                <span className="me-2" style={{ fontSize: '1.2rem' }}>👤</span>
                                                <small className="fw-semibold text-white">Cliente</small>
                                            </div>

                                            {/* FOTO DE USUARIO */}
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

                            <div className="card-body p-2 p-md-3 pb-5">
                                {/* Alertas */}
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

                                {/* Vista móvil - Cards para todas las órdenes */}
                                <div className="d-block d-md-none">
                                    <h6 className="fw-bold text-warning mb-3">📋 TODOS LOS PEDIDOS</h6>

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
                                                        </div>
                                                        <div className="col-12 mb-2">
                                                            <div className="text-muted small">Cliente:</div>
                                                            <div className="fw-semibold">{order.name}</div>
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
                                                <h5 className="text-muted">No hay órdenes disponibles</h5>
                                                <p className="text-muted">Los pedidos aparecerán aquí una vez que sean creados.</p>
                                                <Link to="/pedido" className="btn btn-success">
                                                    Crear nuevo pedido
                                                </Link>
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Vista desktop - Tabla única para todas las órdenes */}
                                <div className="d-none d-md-block">
                                    <h5 className="fw-bold text-warning mb-3">📋 TODOS LOS PEDIDOS</h5>
                                    {todasOrdenes.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-borderless">
                                                <thead>
                                                    <tr className="text-muted">
                                                        <th>Código</th>
                                                        <th>Nombre</th>
                                                        <th>Valor</th>
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
                                                            <td className="fw-bold">{order.id}</td>
                                                            <td>{order.name}</td>
                                                            <td>{formatCurrency(order.value)}</td>
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
                                                <h5 className="text-muted">No hay órdenes disponibles</h5>
                                                <p className="text-muted">Los pedidos aparecerán aquí una vez que sean creados.</p>
                                                <Link to="/pedido" className="btn btn-success">
                                                    Crear nuevo pedido
                                                </Link>
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Botón enviar pendientes */}
                                {ordenesPendientes.length > 0 && (
                                    <div className="d-flex justify-content-center mt-3 mb-5">
                                        <button
                                            className="btn btn-success px-4 py-2 w-100 w-md-auto"
                                            style={{ maxWidth: '300px' }}
                                            onClick={handleSendAllPending}
                                            disabled={isLoading || !isConnected}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={18} className="me-2" />
                                                    Enviar Todos los Pendientes ({ordenesPendientes.length})
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Navegación inferior */}
                             <nav className="fixed-bottom mb-4 bg-transparent" style={{ zIndex: 100 }}>
                                <div className="d-flex justify-content-around align-items-center">
                                    <Link to="/" className="btn btn-success d-flex align-items-center gap-1 gap-md-2 px-3 px-md-4 py-2 shadow rounded-pill">
                                        🔍 <span className="d-none d-md-inline fw-semibold text-white">Catálogo</span>
                                    </Link>
                                    <Link to="/pedido" className="btn btn-success d-flex align-items-center gap-1 gap-md-2 px-3 px-md-4 py-2 shadow rounded-pill">
                                        ➕ <span className="d-none d-md-inline fw-semibold text-white">Pedido</span>
                                    </Link>
                                    <Link to='/ordenes' className="btn btn-success d-flex align-items-center gap-1 gap-md-2 px-3 px-md-4 py-2 shadow rounded-pill">
                                        📄 <span className="d-none d-md-inline fw-semibold text-white">Órdenes</span>
                                    </Link>
                                </div>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de confirmación */}
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

            {/* Backdrop del modal */}
            {showModal && <div className="modal-backdrop fade show"></div>}

            {/* Toggle de conexión para pruebas */}
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