import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Sprout, 
  Layers, 
  CloudSun, 
  CloudRain, 
  Droplets, 
  LogOut, 
  Settings 
} from 'lucide-react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  // Definición de módulos estilo CropWat
  const menuItems = [
    { name: 'Inicio', path: '/home', icon: <Home size={20} /> },
    { name: 'Cultivos', path: '/home/mis-cultivos', icon: <Sprout size={20} /> },
    { name: 'Suelos', path: '/home/suelos', icon: <Layers size={20} /> },
    { name: 'Clima / ETo', path: '/home/clima', icon: <CloudSun size={20} /> },
    { name: 'Precipitaciones', path: '/home/lluvia', icon: <CloudRain size={20} /> },
    { name: 'Programación Riego', path: '/home/riego', icon: <Droplets size={20} /> }, // Futuro módulo
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-xl flex flex-col z-10 hidden md:flex">
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-agri-dark">
            <div className="bg-agri-green p-2 rounded-lg text-white">
              <Sprout size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">ETFlow</span>
          </div>
        </div>
        
        {/* Navegación Principal */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-green-50 text-agri-green font-semibold shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-agri-dark'
                }`}
              >
                {/* Icono con efecto visual al estar activo */}
                <span className={isActive ? 'text-agri-green' : 'text-gray-400 group-hover:text-agri-dark'}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button className="flex items-center gap-3 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 w-full rounded-lg transition-colors">
            <Settings size={18} /> Configuración
          </button>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 w-full rounded-lg transition-colors font-medium"
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL (Scrollable) */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Header móvil (solo visible en pantallas pequeñas) */}
        <header className="bg-white p-4 shadow-sm md:hidden flex justify-between items-center sticky top-0 z-20">
          <span className="font-bold text-agri-dark">ETFlow</span>
          <button onClick={handleLogout}><LogOut size={20} /></button>
        </header>
        
        {/* Aquí se renderizan las páginas hijas */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}