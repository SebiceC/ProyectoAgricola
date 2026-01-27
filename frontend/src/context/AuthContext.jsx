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
    if (token) {
      setUser({ token }); // Simplificado para persistencia rápida
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/users/login/', { email, password });
      
      // 🔍 AQUÍ ESTABA EL ERROR:
      // Tu backend devuelve { token: "..." }, no { access: "..." }
      const { token, user_id, message } = response.data;

      if (token) {
        localStorage.setItem('access_token', token); // Guardamos la llave correcta
        // localStorage.setItem('refresh_token', refresh); // NO TIENES refresh token, bórralo
        
        setUser({ token, id: user_id });
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
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};