import { Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import Loader from '../components/Loader';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useUser();

  if (loading) return <Loader />;

  if (!token) return <Navigate to="/login" />;

  return children;
};

export default ProtectedRoute;
