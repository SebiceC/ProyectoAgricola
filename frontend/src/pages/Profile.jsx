import { useState, useEffect } from 'react';
import api from '../api/axios'; // Asegúrate que la ruta a axios sea correcta
import { toast } from 'react-hot-toast';
import { User, Lock, Save, ShieldCheck } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState({ first_name: '', last_name: '', email: '' });
  
  // Estado para cambio de contraseña
  const [passData, setPassData] = useState({ 
    current_password: '', 
    new_password: '', 
    re_new_password: '' 
  });
  
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Djoser: Obtener datos del usuario actual
      const res = await api.get('/auth/users/me/');
      setUser(res.data);
    } catch (error) {
      toast.error("Error cargando perfil");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
        await api.patch('/auth/users/me/', {
            first_name: user.first_name,
            last_name: user.last_name
        });
        toast.success("Perfil actualizado");
    } catch (error) {
        toast.error("No se pudo actualizar");
    } finally {
        setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passData.new_password !== passData.re_new_password) {
        return toast.error("Las nuevas contraseñas no coinciden");
    }
    
    setLoadingPass(true);
    try {
        // Djoser: Endpoint para cambio de contraseña (requiere token)
        await api.post('/auth/users/set_password/', {
            current_password: passData.current_password,
            new_password: passData.new_password,
            re_new_password: passData.re_new_password
        });
        
        toast.success("Contraseña actualizada con éxito");
        setPassData({ current_password: '', new_password: '', re_new_password: '' });
        
    } catch (error) {
        console.error(error);
        // Manejo de errores específicos de Djoser
        const msg = error.response?.data?.current_password 
            ? "La contraseña actual es incorrecta" 
            : "Error: La contraseña debe tener al menos 8 caracteres y no ser común.";
        toast.error(msg);
    } finally {
        setLoadingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in zoom-in duration-300">
      <h1 className="text-3xl font-bold text-agri-dark flex items-center gap-3">
        <User className="text-blue-600" size={32}/> Mi Perfil
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 1. TARJETA DE DATOS PERSONALES */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
                <ShieldCheck size={20} className="text-green-600"/> Datos Personales
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Correo (No editable)</label>
                    <input type="email" value={user.email} disabled className="w-full bg-gray-100 border p-3 rounded text-gray-500 cursor-not-allowed"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                        <input type="text" className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={user.first_name} onChange={e => setUser({...user, first_name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Apellido</label>
                        <input type="text" className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                             value={user.last_name} onChange={e => setUser({...user, last_name: e.target.value})}
                        />
                    </div>
                </div>
                <button disabled={loadingProfile} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center gap-2">
                    {loadingProfile ? 'Guardando...' : <><Save size={18}/> Actualizar Datos</>}
                </button>
            </form>
        </div>

        {/* 2. TARJETA DE CAMBIO DE CONTRASEÑA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
                <Lock size={20} className="text-amber-600"/> Seguridad
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Contraseña Actual</label>
                    <input type="password" required className="w-full border p-3 rounded focus:ring-2 focus:ring-amber-500 outline-none"
                        value={passData.current_password} onChange={e => setPassData({...passData, current_password: e.target.value})}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Nueva Contraseña</label>
                    <input type="password" required className="w-full border p-3 rounded focus:ring-2 focus:ring-amber-500 outline-none"
                        placeholder="Mínimo 8 caracteres"
                        value={passData.new_password} onChange={e => setPassData({...passData, new_password: e.target.value})}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Confirmar Nueva</label>
                    <input type="password" required className="w-full border p-3 rounded focus:ring-2 focus:ring-amber-500 outline-none"
                        value={passData.re_new_password} onChange={e => setPassData({...passData, re_new_password: e.target.value})}
                    />
                </div>
                <button disabled={loadingPass} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center gap-2">
                    {loadingPass ? 'Procesando...' : <><Lock size={18}/> Cambiar Contraseña</>}
                </button>
            </form>
        </div>

      </div>
    </div>
  );
}