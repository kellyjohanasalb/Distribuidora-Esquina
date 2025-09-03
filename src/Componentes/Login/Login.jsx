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
  /* const [rememberMe, setRememberMe] = useState(false); */

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
       /*  rememberMe  */
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
              <span className="input-group-text bg-transparent text-white border-end-0">
                <i className="fas fa-user"></i>
              </span>
              <input 
                type="text" 
                className="form-control border-start-0" 
                placeholder="Usuario o correo electrónico"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text bg-transparent text-white border-end-0">
                <i className="fas fa-lock"></i>
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control border-start-0" 
                placeholder="Contraseña"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <span 
                className="input-group-text bg-transparent text-white border-start-0 toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={showPassword ? "fas fa-eye" : "fas fa-eye-slash"}></i>
              </span>
            </div>
          </div>
          
          {/* <div className="mb-3 form-check">
            <input 
              type="checkbox" 
              className="form-check-input" 
              id="rememberMe" 
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />
            <label className="form-check-label" htmlFor="rememberMe">
              Recordar mi cuenta
            </label>
          </div> */}
          
          <button type="submit" className="btn btn-login">Iniciar Sesión</button>
        </form>
      </div>
    </div>
  );
};

export default Login;