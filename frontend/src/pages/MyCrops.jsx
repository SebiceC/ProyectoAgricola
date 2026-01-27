import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Plus, Droplets, Calendar, Map } from 'lucide-react';

export default function MyCrops() {
  const [plantings, setPlantings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar MIS siembras
    api.get('/cultivo/plantings/')
      .then(res => {
        setPlantings(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando tus cultivos...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-agri-dark">Mis Cultivos Activos</h1>
          <p className="text-gray-500 text-sm">Gestiona tus siembras y estados fenológicos</p>
        </div>
        <Link 
          to="/home/nuevo-cultivo" 
          className="flex items-center gap-2 bg-agri-green text-white px-4 py-2 rounded-lg hover:bg-agri-dark transition-colors shadow-sm"
        >
          <Plus size={18} /> Nueva Siembra
        </Link>
      </div>

      {plantings.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 text-agri-green">
            <Plus size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No tienes cultivos registrados</h3>
          <p className="text-gray-500 mb-6 mt-1">Comienza registrando tu primera siembra para calcular el riego.</p>
          <Link to="/home/nuevo-cultivo" className="text-agri-green font-bold hover:underline">
            ¡Sembrar ahora!
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plantings.map((plant) => (
            <div key={plant.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                {/* Usamos crop_details si existe, sino un fallback */}
                <h3 className="text-xl font-bold text-gray-800">
                  {plant.crop_details?.nombre || "Cultivo #" + plant.crop}
                </h3>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  En Desarrollo
                </span>
              </div>
              
              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-agri-green" />
                  <div>
                    <p className="text-xs text-gray-400">Fecha Siembra</p>
                    <span className="font-medium">{plant.fecha_siembra}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Map size={18} className="text-agri-green" />
                  <div>
                    <p className="text-xs text-gray-400">Área Sembrada</p>
                    <span className="font-medium">{plant.area} Hectáreas</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                 <button className="text-gray-500 hover:text-agri-dark text-sm font-medium transition-colors">
                   Ver Detalles
                 </button>
                 <button className="bg-blue-50 text-blue-700 p-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm font-bold">
                   <Droplets size={16} /> Riego
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}