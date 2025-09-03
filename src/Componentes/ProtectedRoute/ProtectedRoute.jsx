import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx'; // Ruta y extensión correctas

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;