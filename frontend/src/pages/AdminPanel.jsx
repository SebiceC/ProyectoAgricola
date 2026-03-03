import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, ShieldOff, AlertCircle } from 'lucide-react';

export default function AdminPanel() {
    const { user, logout } = useAuth();
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Verificación extra de seguridad en frontend
    const isAdmin = user?.roles?.includes('Administrador');

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/');
            setUsersList(response.data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        } else {
            setLoading(false);
        }
    }, [isAdmin]);

    const handleAssignRole = async (userId, roleName) => {
        try {
            await api.post(`/users/${userId}/assign-role/`, { role: roleName });
            toast.success(`Rol ${roleName} asignado correctamente`);
            fetchUsers(); // Recargar la lista
        } catch (error) {
            console.error(error);
            toast.error('Error al asignar rol');
        }
    };

    const handleRemoveRole = async (userId, roleName) => {
        try {
            await api.delete(`/users/${userId}/remove-role/`, { data: { role: roleName } });

            // Si el usuario se quita el admin a sí mismo, forzamos cierre de sesión
            if (userId === user?.id) {
                toast.success('Te has retirado los permisos de administrador. Cerrando sesión...');
                setTimeout(() => logout(), 1500);
            } else {
                toast.success(`Rol ${roleName} removido correctamente`);
                fetchUsers(); // Recargar la lista
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al revocar rol');
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-red-50 text-red-700 rounded-xl mt-10">
                <AlertCircle size={48} className="mb-4" />
                <h2 className="text-2xl font-bold">Acceso Denegado</h2>
                <p>No tienes permisos de Administrador para ver esta página.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-agri-dark p-3 rounded-lg text-white shadow-sm">
                    <Users size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Panel Administrativo</h1>
                    <p className="text-gray-500">Gestión de usuarios y roles del sistema.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Correo</th>
                                <th className="px-6 py-4 text-center">Rol Actual</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-gray-400">
                                        Cargando usuarios...
                                    </td>
                                </tr>
                            ) : usersList.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-gray-400">
                                        No hay usuarios registrados en el sistema.
                                    </td>
                                </tr>
                            ) : (
                                usersList.map((usr) => {
                                    const isUserAdmin = usr.role && usr.role.includes('Administrador');
                                    // Evitar que el admin se quite el rol a sí mismo para prevenir lockouts
                                    const isCurrentSessionUser = usr.id === user?.id;

                                    return (
                                        <tr key={usr.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {usr.name || 'Sin Nombre'}
                                            </td>
                                            <td className="px-6 py-4">{usr.email}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${isUserAdmin
                                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                        : 'bg-green-50 text-agri-green border-green-200'
                                                    }`}>
                                                    {isUserAdmin ? 'Administrador' : 'Usuario'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isCurrentSessionUser ? (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm("¿Estás seguro que deseas remover tus propios permisos de Administrador? Se cerrará tu sesión inmediatamente.")) {
                                                                handleRemoveRole(usr.id, 'Administrador');
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 min-w-[140px] justify-center text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md transition-colors"
                                                    >
                                                        <AlertCircle size={14} /> Quitar mi Admin
                                                    </button>
                                                ) : isUserAdmin ? (
                                                    <button
                                                        onClick={() => handleRemoveRole(usr.id, 'Administrador')}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 min-w-[140px] justify-center text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                                                    >
                                                        <ShieldOff size={14} /> Revocar Admin
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAssignRole(usr.id, 'Administrador')}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 min-w-[140px] justify-center text-xs font-semibold text-white bg-agri-dark hover:bg-black rounded-md transition-colors shadow-sm"
                                                    >
                                                        <Shield size={14} /> Hacer Admin
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
