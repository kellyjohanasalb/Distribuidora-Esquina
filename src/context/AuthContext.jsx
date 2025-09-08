/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar autenticación al cargar
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const tokenExpiration = localStorage.getItem('tokenExpiration');
    const savedUser = localStorage.getItem('user');

    if (token && tokenExpiration && savedUser) {
      // Verificar si el token aún es válido (no ha expirado)
      const now = new Date().getTime();
      if (now < parseInt(tokenExpiration)) {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
        
        // Programar cierre de sesión automático
        const timeout = parseInt(tokenExpiration) - now;
        setTimeout(() => {
          logout();
          window.location.href = '/login';
        }, timeout);
      } else {
        // Token expirado, limpiar localStorage
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    // Calcular expiración a medianoche (23:59:59)
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23, 59, 59
    );
    const expirationTime = midnight.getTime();

    // Guardar en localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('tokenExpiration', expirationTime.toString());
    localStorage.setItem('user', JSON.stringify(userData));

    setIsAuthenticated(true);
    setUser(userData);

    // Programar cierre de sesión automático a medianoche
    const timeout = expirationTime - now.getTime();
    setTimeout(() => {
      logout();
      window.location.href = '/login';
    }, timeout);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('user');
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};