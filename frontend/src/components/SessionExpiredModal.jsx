import { useEffect, useState } from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';

export default function SessionExpiredModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Escuchamos el grito de Axios
    const handleSessionExpired = () => setIsOpen(true);

    window.addEventListener('auth:session-expired', handleSessionExpired);

    // Limpieza de memoria al desmontar
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  const handleLoginRedirect = () => {
    setIsOpen(false);
    window.location.href = '/login';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-t-4 border-orange-500 transform scale-100 transition-transform">
        
        <div className="flex flex-col items-center text-center">
          <div className="bg-orange-100 p-4 rounded-full mb-4">
            <AlertTriangle size={40} className="text-orange-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sesión Expirada</h2>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Por motivos de seguridad, tu sesión ha finalizado debido a inactividad o cambios en tus credenciales. 
            <br/><br/>
            <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-500">
              Error 401: Unauthorized
            </span>
          </p>

          <button 
            onClick={handleLoginRedirect}
            className="w-full bg-agri-dark hover:bg-slate-800 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            <LogOut size={20} />
            Volver a Iniciar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}