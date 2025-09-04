/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ← Estado de carga

  // Verificar autenticación al cargar
    useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const authStatus = localStorage.getItem('isAuthenticated');
    
    if (savedUser && authStatus === 'true') {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setLoading(false); // ← Finalizar carga
  }, []);

  // Configurar el cierre de sesión automático a las 23:59
  useEffect(() => {
    if (!isAuthenticated) return;

    const now = new Date();
    const night = new Date();
    night.setHours(23, 59, 0, 0);

    const timeout = night.getTime() - now.getTime();

    const timer = setTimeout(() => {
      logout();
      // Puedes redirigir al login si lo deseas
      window.location.href = '/login';
    }, timeout);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const login = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    
    if (userData.rememberMe) {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  };

    const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading // ← Exponer estado de carga
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};