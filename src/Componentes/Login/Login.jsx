import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/pedido');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validación simple
    if (!formData.username || !formData.password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    // Datos quemados para prueba
    const users = [
      { username: 'admin', password: 'admin123', name: 'Administrador' },
      { username: 'lore1', password: 'lore123', name: 'Lore Pérez' },
      { username: 'kelly', password: 'kelly123', name: 'Kelly Sabb' }
    ];

    const user = users.find(u => 
      u.username === formData.username && u.password === formData.password
    );

    if (user) {
      // Login exitoso
      login({ 
        username: user.username, 
        name: user.name,
      });
      navigate('/pedido');
    } else {
      setError('Credenciales incorrectas. Intente con admin/admin123 o kelly/kelly123');
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card">
        <div className="logo-container">
          <div className="company-logo">
            {/* Logo será mostrado por CSS */}
          </div>
          <h2 className="mb-3">Distribuidora-Esquina</h2>
          <p className="mb-4">Ingresa a tu cuenta para continuar</p>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-user"></i>
              </span>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Usuario o correo electrónico"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="mb-3 password-input-container">
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-lock"></i>
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control" 
                placeholder="Contraseña"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <span 
                className="input-group-text toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <i className={showPassword ? "fas fa-eye" : "fas fa-eye-slash"}></i>
              </span>
            </div>
            <div className="password-hint">
              <small>Haz clic en el ojo para ver la contraseña</small>
            </div>
          </div>
          
          <button type="submit" className="btn btn-login">Iniciar Sesión</button>
          
          <div className="text-center mt-3">
            <button 
              type="button" 
              className="btn btn-catalog"
              onClick={() => navigate('/catalogo')}
            >
              Ver Catálogo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;