import React, { useStat, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';


const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      setError('Por favor, completa todos los campos');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('https://remito-send-back-main.vercel.app/api/auth/login', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);

   if (!response.ok) {
  console.log('Error response:', response.status, data);
  if (response.status === 401) {
    throw new Error('Correo o contraseña incorrectos');
  } else {
    throw new Error(data.message || 'Error en la autenticación');
  }
}
      
      const token = data['access_token'] || data['access-token'] || data['access-teker'];
      
      if (token) {
        login({
          username: data.username,
          email: data.email,
          userId: data.user_id
        }, token);
        
        navigate('/pedido');
      } else {
        throw new Error('No se recibió token de acceso');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Error al conectar con el servidor');
      console.log('Error message set:', error.message);
    } finally {
      setIsLoading(false);
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

        {error && (
  <div className="alert alert-danger" style={{animation: 'fadeIn 0.5s ease-in'}}>
    <i className="fas fa-exclamation-circle me-2"></i>
    {error}
  </div>
)}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-user"></i>
              </span>
              <input
                type="email"
                className="form-control"
                placeholder="Correo electrónico"
                name="email"
                value={formData.email}
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

          <button
            type="submit"
            className="btn btn-login"
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

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