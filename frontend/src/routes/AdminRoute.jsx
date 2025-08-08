import { useUser } from '../contexts/UserContext';

export default function AdminRoute({ children }) {
  const { user } = useUser();

  return user?.role?.includes('Administrador') ? (
    children
  ) : (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>No tienes permisos para acceder a esta página.</h2>
    </div>
  );
}
