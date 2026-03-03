import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión al recargar
    const token = localStorage.getItem('access_token');
    const userId = localStorage.getItem('user_id');
    const rolesStr = localStorage.getItem('user_roles');
    let roles = [];
    if (rolesStr) {
      try { roles = JSON.parse(rolesStr); } catch (e) { }
    }

    if (token) {
      setUser({ token, id: userId, roles }); // Persistimos token, id y roles
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/users/login/', { email, password });

      // 🔍 AQUÍ ESTABA EL ERROR:
      // Tu backend devuelve { token: "..." }, no { access: "..." }
      const { token, user_id, message, roles } = response.data;

      if (token) {
        localStorage.setItem('access_token', token); // Guardamos la llave correcta
        localStorage.setItem('user_roles', JSON.stringify(roles || []));
        localStorage.setItem('user_id', user_id); // Guardamos el ID

        setUser({ token, id: user_id, roles: roles || [] });
        toast.success(message || 'Bienvenido');
        return true;
      }
    } catch (error) {
      console.error(error);
      toast.error('Credenciales incorrectas');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_roles');
    localStorage.removeItem('user_id');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};