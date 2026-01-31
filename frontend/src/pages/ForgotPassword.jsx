import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios'; // Ajusta la ruta según tu estructura
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Endpoint estándar de Djoser para solicitar reseteo
      await api.post('/auth/users/reset_password/', { email });
      
      // Por seguridad, siempre mostramos éxito aunque el correo no exista (para no revelar usuarios)
      toast.success("Si el correo existe, recibirás un enlace en breve.", {
        duration: 5000,
        icon: '📩'
      });
      setEmail('');
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
            <Mail size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Recuperar Acceso</h2>
          <p className="text-gray-500 text-sm mt-2">
            Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="ejemplo@finca.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Enviando...' : <><Send size={18} /> Enviar Enlace</>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-blue-600 flex items-center justify-center gap-1">
            <ArrowLeft size={16} /> Volver al Login
          </Link>
        </div>
      </div>
    </div>
  );
}