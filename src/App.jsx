import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Home from './Pages/Home';
import VistaPedidoPage from './Pages/vistaPedidoPage';
import OrdersView from './Pages/ordersView';
import LoginPage from './Pages/LoginPage';
import ProtectedRoute from './Componentes/ProtectedRoute/ProtectedRoute.jsx';
import ErrorBoundary from './Componentes/ErrorBoundaries.jsx';

// Componente para redireccionar rutas incorrectas
const RedirectToHome = () => {
  return <Navigate to="/" replace />;
};

// Nuevo componente para manejar la carga
const AppContent = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/pedido" replace /> : <LoginPage />
          } 
        />
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
  );
};

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
