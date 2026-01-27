import { Link } from 'react-router-dom';
import { Sprout, Layers, CloudSun, CloudRain, Plus, ArrowRight } from 'lucide-react';

export default function Home() {
  const cards = [
    {
      title: "Gestionar Cultivos",
      desc: "Registra nuevas siembras y monitorea el estado fenológico.",
      icon: <Sprout size={32} />,
      link: "/home/nuevo-cultivo",
      color: "bg-green-50 text-green-700",
      btnText: "Nueva Siembra"
    },
    {
      title: "Perfiles de Suelo",
      desc: "Configura tipos de suelo, infiltración y retención de humedad.",
      icon: <Layers size={32} />,
      link: "/home/suelos",
      color: "bg-amber-50 text-amber-700",
      btnText: "Configurar Suelos"
    },
    {
      title: "Datos Climáticos",
      desc: "Calcula la ETo usando datos satelitales (NASA/Power).",
      icon: <CloudSun size={32} />,
      link: "/home/clima", // Asegúrate de crear esta ruta luego
      color: "bg-blue-50 text-blue-700",
      btnText: "Calcular ETo"
    },
    {
      title: "Precipitaciones",
      desc: "Registra lluvias manuales o conecta estaciones meteorológicas.",
      icon: <CloudRain size={32} />,
      link: "/home/lluvia", // Asegúrate de crear esta ruta luego
      color: "bg-slate-50 text-slate-700",
      btnText: "Ver Lluvias"
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Panel General</h1>
        <p className="text-gray-500 mt-1">Bienvenido al sistema de gestión de recursos hídricos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between h-full">
            <div>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
                {card.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{card.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{card.desc}</p>
            </div>
            
            <Link 
              to={card.link} 
              className="group flex items-center gap-2 text-sm font-bold text-agri-dark hover:text-agri-green transition-colors"
            >
              {card.btnText} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ))}
      </div>

      {/* Sección Informativa Rápida */}
      <div className="mt-8 bg-gradient-to-r from-agri-dark to-green-900 rounded-2xl p-8 text-white flex justify-between items-center shadow-lg">
        <div>
          <h2 className="text-2xl font-bold mb-2">¿Necesitas ayuda con los cálculos?</h2>
          <p className="text-green-100 opacity-90 max-w-lg">
            Recuerda que para generar un calendario de riego, primero debes configurar el 
            <strong> Suelo</strong> y registrar una <strong>Siembra Activa</strong>.
          </p>
        </div>
        <div className="hidden lg:block bg-white/10 p-4 rounded-full">
            <Plus size={40} className="text-white" />
        </div>
      </div>
    </div>
  );
}