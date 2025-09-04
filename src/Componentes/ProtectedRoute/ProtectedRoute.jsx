import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth(); // Añadir loading
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;