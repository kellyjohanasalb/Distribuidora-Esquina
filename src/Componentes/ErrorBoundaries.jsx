import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, info) {
    console.error("Error Boundary:", error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger">
          <h4>Algo salió mal</h4>
          <button onClick={() => window.location.reload()}>
            Recargar aplicación
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;