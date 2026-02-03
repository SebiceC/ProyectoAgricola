import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '', // Requerido por tu schema
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas frontend
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Las contraseñas no coinciden');
    }
    if (formData.password.length < 6) {
      return toast.error('La contraseña debe tener al menos 6 caracteres');
    }

    setLoading(true);
    try {
      // Endpoint según schema.yaml: /api/users/register/
      await api.post('/users/register/', {
        username: formData.username,
        email: formData.email,
        password: formData.password
        // Role no se envía, el backend asigna por defecto
      });

      toast.success('¡Cuenta creada con éxito! Ahora inicia sesión.');
      navigate('/login');
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.username ? 'El nombre de usuario ya existe' : 
                       error.response?.data?.email ? 'El email ya está registrado' : 
                       'Error al registrarse';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-agri-dark">Crear Cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">¡Únete a ETFlow!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* USERNAME */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Usuario</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                required
                className="w-full pl-9 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-agri-green outline-none"
                placeholder="Nombre de usuario"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="email"
                required
                className="w-full pl-9 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-agri-green outline-none"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-9 pr-9 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-agri-green outline-none"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button
                type="button"
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Confirmar</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="password"
                required
                className="w-full pl-9 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-agri-green outline-none"
                placeholder="Repite la contraseña"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2 px-4 bg-agri-green hover:bg-agri-dark text-white font-bold rounded shadow transition-colors flex justify-center items-center gap-2"
          >
            {loading ? 'Registrando...' : <>Registrarse <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-gray-500 hover:text-agri-green transition-colors">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}