import React, { useState } from 'react';
import { Check, Package, FileText, Send, X, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrdersView = () => {
    const [orders, setOrders] = useState([
        {
            id: 23001,
            name: "Juliana Restrepo",
            value: 3456789,
            status: "Pendiente"
        },
        {
            id: 12356,
            name: "Carlos Martinez",
            value: 2100000,
            status: "Pendiente"
        },
        {
            id: 15684,
            name: "Felipe Tobón",
            value: 9235985,
            status: "Enviado"
        }
    ]);

    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
    const [isConnected, setIsConnected] = useState(true);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value);
    };

    const handleSendOrder = (order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    const confirmSendOrder = async () => {
        if (!selectedOrder) return;

        setIsLoading(true);

        try {
            // Simular llamada al backend
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (isConnected && Math.random() > 0.2) { // 80% success rate
                        resolve();
                    } else {
                        reject(new Error('Error de conexión'));
                    }
                }, 1500);
            });

            // Actualizar estado del pedido
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === selectedOrder.id
                        ? { ...order, status: 'Enviado' }
                        : order
                )
            );

            setAlert({
                show: true,
                type: 'success',
                message: `Pedido #${selectedOrder.id} enviado exitosamente`
            });

        } catch (error) {
            setAlert({
                show: true,
                type: 'error',
                message: 'Error al enviar el pedido. Intente nuevamente.'
            });
        } finally {
            setIsLoading(false);
            setShowModal(false);
            setSelectedOrder(null);
        }
    };

    const sendAllPending = async () => {
        const pendingOrders = orders.filter(order => order.status === 'Pendiente');

        if (pendingOrders.length === 0) {
            setAlert({
                show: true,
                type: 'warning',
                message: 'No hay pedidos pendientes para enviar'
            });
            return;
        }

        setIsLoading(true);

        try {
            // Simular envío masivo
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (isConnected && Math.random() > 0.3) {
                        resolve();
                    } else {
                        reject(new Error('Error de conexión'));
                    }
                }, 2000);
            });

            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.status === 'Pendiente'
                        ? { ...order, status: 'Enviado' }
                        : order
                )
            );

            setAlert({
                show: true,
                type: 'success',
                message: `${pendingOrders.length} pedidos enviados exitosamente`
            });

        } catch (error) {
            setAlert({
                show: true,
                type: 'error',
                message: 'Error al enviar los pedidos. Intente nuevamente.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const dismissAlert = () => {
        setAlert({ show: false, type: '', message: '' });
    };

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
                                    </div>
                                    <div className="col-auto">
                                        <div className="d-flex align-items-center">
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

                            <div className="card-body p-2 p-md-3">
                                {/* Alertas */}
                                {alert.show && (
                                    <div className={`alert alert-${alert.type === 'success' ? 'success' : alert.type === 'error' ? 'danger' : 'warning'} alert-dismissible fade show`} role="alert">
                                        <div className="d-flex align-items-center">
                                            {alert.type === 'success' && <Check className="me-2" size={20} />}
                                            {alert.type === 'error' && <X className="me-2" size={20} />}
                                            <small>{alert.message}</small>
                                        </div>
                                        <button type="button" className="btn-close" onClick={dismissAlert}></button>
                                    </div>
                                )}

                                {/* Vista móvil - Cards */}
                                <div className="d-block d-md-none">
                                    {orders.map((order) => (
                                        <div key={order.id} className={`card mb-3 ${order.status === 'Enviado' ? 'border-success bg-light' : 'border-warning'}`}>
                                            <div className="card-body p-3">
                                                <div className="row align-items-center">
                                                    <div className="col-12 mb-2">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <h6 className="mb-0 fw-bold text-primary">#{order.id}</h6>
                                                            <span className={`badge ${order.status === 'Pendiente' ? 'bg-warning text-dark' : 'bg-success'} px-2 py-1`}>
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
                                                    {order.status === 'Pendiente' && (
                                                        <div className="col-12">
                                                            <button
                                                                className="btn btn-success btn-sm w-100"
                                                                onClick={() => handleSendOrder(order)}
                                                                disabled={isLoading}
                                                            >
                                                                <Send size={16} className="me-1" />
                                                                Enviar
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Vista desktop - Tabla */}
                                <div className="d-none d-md-block">
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
                                                {orders.map((order) => (
                                                    <tr key={order.id} className={order.status === 'Enviado' ? 'table-success' : ''}>
                                                        <td className="fw-bold">{order.id}</td>
                                                        <td>{order.name}</td>
                                                        <td>{formatCurrency(order.value)}</td>
                                                        <td>
                                                            <span className={`badge ${order.status === 'Pendiente' ? 'bg-warning text-dark' : 'bg-success'} px-3 py-2`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {order.status === 'Pendiente' && (
                                                                <button
                                                                    className="btn btn-success btn-sm px-3"
                                                                    onClick={() => handleSendOrder(order)}
                                                                    disabled={isLoading}
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
                                </div>

                                {/* Botón enviar pendientes */}
                                <div className="d-flex justify-content-center mt-3">
                                    <button
                                        className="btn btn-success px-4 py-2 w-100 w-md-auto"
                                        style={{ maxWidth: '300px' }}
                                        onClick={sendAllPending}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={18} className="me-2" />
                                                Enviar Pendientes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Navegación inferior */}
                            <nav className="fixed-bottom mb-4 bg-transparent">
                                <div className="d-flex justify-content-around align-items-center">
                                    <Link to="/" className="btn btn-success d-flex align-items-center gap-2 px-4 py-2 shadow rounded-pill">
                                        🔍 <span className="fw-semibold text-white">Catálogo</span>
                                    </Link>
                                    <Link to="/pedido" className="btn btn-success d-flex align-items-center gap-2 px-4 py-2 shadow rounded-pill">
                                        ➕ <span className="fw-semibold text-white">Pedido</span>
                                    </Link>
                                    <Link to='/ordenes' className="btn btn-success d-flex align-items-center gap-2 px-4 py-2 shadow rounded-pill">
                                        📄 <span className="fw-semibold text-white">Órdenes</span>
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
            <div className="position-fixed" style={{ bottom: '15px', right: '15px', zIndex: 1000 }}>
                <button
                    className={`btn btn-sm ${isConnected ? 'btn-success' : 'btn-danger'}`}
                    onClick={() => setIsConnected(!isConnected)}
                    style={{ width: '40px', height: '40px' }}
                >
                    {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                </button>
            </div>
        </div>
    );
};

export default OrdersView;