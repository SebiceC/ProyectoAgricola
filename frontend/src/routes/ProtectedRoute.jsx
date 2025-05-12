import { Navigate } from 'react-router-dom';

// Componente que protege rutas privadas
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated');

  // Si no está autenticado, redirige al login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Si está autenticado, muestra el componente
  return children;
};

export default ProtectedRoute;
