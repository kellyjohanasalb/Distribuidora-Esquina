import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Pages/Home';
import VistaPedidoPage from './Pages/vistaPedidoPage';
import OrdersView from './Pages/ordersView';
import { useEffect } from 'react';

// Componente para redireccionar rutas incorrectas
const RedirectToHome = () => {
  useEffect(() => {
    window.location.href = '/';
  }, []);
  return null;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pedido" element={<VistaPedidoPage />} />
        <Route path="/ordenes" element={<OrdersView />} />
        {/* Ruta de captura para cualquier otra ruta */}
        <Route path="*" element={<RedirectToHome />} />
      </Routes>
    </Router>
  );
}

export default App;