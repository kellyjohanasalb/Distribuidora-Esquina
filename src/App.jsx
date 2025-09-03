import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Home from './Pages/Home';
import VistaPedidoPage from './Pages/vistaPedidoPage';
import OrdersView from './Pages/ordersView';
import LoginPage from './Pages/LoginPage';
import ProtectedRoute from './Componentes/ProtectedRoute/ProtectedRoute.jsx';
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
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/pedido"
            element={
              <ProtectedRoute>
                <VistaPedidoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ordenes"
            element={
              <ProtectedRoute>
                <OrdersView />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<RedirectToHome />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;