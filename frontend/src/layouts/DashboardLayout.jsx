import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Sprout, 
  Layers, 
  CloudSun, 
  CloudRain, 
  Droplets, 
  LogOut, 
  Settings,
  UserCircle,
  Menu, // 🟢 Icono Hamburguesa
  X     // 🟢 Icono Cerrar
} from 'lucide-react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false); // Estado para el menú móvil

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  // Función para cerrar el menú automáticamente al hacer clic en un enlace (Mejora UX móvil)
  const closeMobileMenu = () => setIsMobileOpen(false);

  // Definición de módulos
  const menuItems = [
    { name: 'Inicio', path: '/home', icon: <Home size={20} /> },
    { name: 'Clima / ETo', path: '/home/clima', icon: <CloudSun size={20} /> },
    { name: 'Precipitaciones', path: '/home/lluvia', icon: <CloudRain size={20} /> },
    { name: 'Cultivos', path: '/home/mis-cultivos', icon: <Sprout size={20} /> },
    { name: 'Suelos', path: '/home/suelos', icon: <Layers size={20} /> },
    { name: 'Programación Riego', path: '/home/riego', icon: <Droplets size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* 🌑 OVERLAY (FONDO OSCURO) PARA MÓVIL */}
      {/* Se muestra solo si el menú está abierto en pantallas pequeñas */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
          onClick={closeMobileMenu} // Cierra el menú al tocar afuera
        />
      )}

      {/* 🚪 SIDEBAR (BARRA LATERAL) RESPONSIVA */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl flex flex-col 
        transform transition-transform duration-300 ease-in-out
        md:static md:translate-x-0 
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-agri-dark">
            <div className="bg-agri-green p-2 rounded-lg text-white">
              <Sprout size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">ETFlow</span>
          </div>
          {/* Botón X para cerrar en móvil */}
          <button 
            onClick={closeMobileMenu} 
            className="md:hidden text-gray-400 hover:text-red-500"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Navegación Principal */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu} // 🟢 Cierra el menú al navegar
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-green-50 text-agri-green font-semibold shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-agri-dark'
                }`}
              >
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
          
          <Link 
            to="/home/mi-perfil"
            onClick={closeMobileMenu}
            className={`flex items-center gap-3 px-4 py-2 text-sm w-full rounded-lg transition-colors ${
              location.pathname === '/home/mi-perfil'
                ? 'bg-green-50 text-agri-green font-semibold'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <UserCircle size={18} /> Mi Perfil
          </Link>

          <Link 
            to="/home/settings"
            onClick={closeMobileMenu}
            className={`flex items-center gap-3 px-4 py-2 text-sm w-full rounded-lg transition-colors ${
              location.pathname === '/home/settings'
                ? 'bg-green-50 text-agri-green font-semibold'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <Settings size={18} /> Configuración
          </Link>
          
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 w-full rounded-lg transition-colors font-medium"
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 📱 CONTENIDO PRINCIPAL + HEADER MÓVIL */}
      <main className="flex-1 overflow-y-auto relative w-full">
        
        {/* Header móvil (Hamburguesa) */}
        <header className="bg-white p-4 shadow-sm md:hidden flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* 🟢 Botón Hamburguesa */}
            <button 
              onClick={() => setIsMobileOpen(true)} 
              className="text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <span className="font-bold text-agri-dark text-lg">ETFlow</span>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">
            <LogOut size={20} />
          </button>
        </header>
        
        {/* Contenido de la página (Outlet) */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}