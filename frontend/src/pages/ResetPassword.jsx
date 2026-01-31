import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Lock, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [formData, setFormData] = useState({ new_password: '', re_new_password: '' });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  // Capturamos los parámetros de la URL (definidos en el router)
  const { uid, token } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.re_new_password) {
      return toast.error("Las contraseñas no coinciden");
    }
    
    if (formData.new_password.length < 8) {
        return toast.error("La contraseña debe tener al menos 8 caracteres");
    }

    setLoading(true);

    try {
      // Endpoint de Djoser para confirmar el cambio
      await api.post('/auth/users/reset_password_confirm/', {
        uid,
        token,
        new_password: formData.new_password,
        re_new_password: formData.re_new_password
      });

      toast.success("¡Contraseña restablecida con éxito!");
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => navigate('/login'), 2000);

    } catch (error) {
      console.error(error);
      // Djoser suele devolver errores específicos (token inválido, password muy simple, etc.)
      const msg = error.response?.data?.token ? "El enlace ha expirado o es inválido." : "Error al cambiar la contraseña.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Nueva Contraseña</h2>
          <p className="text-gray-500 text-sm mt-2">
            Crea una contraseña segura para recuperar el acceso a tu cuenta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
            <input
              type="password"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="••••••••"
              value={formData.new_password}
              onChange={(e) => setFormData({...formData, new_password: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
            <input
              type="password"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="••••••••"
              value={formData.re_new_password}
              onChange={(e) => setFormData({...formData, re_new_password: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Procesando...' : <><CheckCircle size={18} /> Confirmar Cambio</>}
          </button>
        </form>
      </div>
    </div>
  );
}