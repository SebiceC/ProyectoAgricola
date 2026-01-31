import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Plus, Droplets, Calendar, Map, Edit3, Trash2, ArrowRight, Layers, Sprout, X, Ruler } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MyCrops() {
  const [plantings, setPlantings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanting, setSelectedPlanting] = useState(null); // Estado para el modal
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    api.get('/cultivo/plantings/')
      .then(res => {
        setPlantings(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleEdit = (plant) => {
      navigate('/home/nuevo-cultivo', { state: { plantingToEdit: plant } });
  };

  const handleDelete = async (id) => {
      if(!window.confirm("¿Estás seguro de eliminar este cultivo?")) return;
      try {
          await api.delete(`/cultivo/plantings/${id}/`);
          toast.success("Cultivo eliminado");
          loadData();
      } catch (error) {
          toast.error("No se pudo eliminar");
      }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando tus cultivos...</div>;

  return (
    <div className="relative">
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
          <p className="text-gray-500 mb-4">No tienes cultivos registrados.</p>
          <Link to="/home/nuevo-cultivo" className="text-agri-green font-bold hover:underline">
            ¡Sembrar ahora!
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plantings.map((plant) => (
            <div key={plant.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group relative">
              <div className="flex justify-between items-start mb-4 pr-16">
                <h3 className="text-xl font-bold text-gray-800">
                  {plant.crop_details?.nombre || "Cultivo #" + plant.crop}
                </h3>
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
                  <Layers size={18} className="text-amber-600" />
                  <div>
                    <p className="text-xs text-gray-400">Suelo</p>
                    <span className="font-medium text-amber-800">
                        {plant.soil?.nombre || <span className="text-red-400 font-bold">⚠️ Sin Asignar</span>}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              {/* 🟢 BOTÓN EDITAR */}
                <button 
                  onClick={() => handleEdit(plant)}
                  className="text-gray-500 hover:text-amber-700 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <Edit3 size={16} /> Editar
                </button>
                <button onClick={() => handleDelete(plant.id)} className="text-red-400 hover:text-red-600 text-sm font-medium flex items-center gap-1 transition-colors">
                  <Trash2 size={16} /> Eliminar
                </button>
                <Link to="/home/riego" className="bg-blue-50 text-blue-700 p-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm font-bold">
                    <Droplets size={16} /> Riego
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🟢 MODAL DE DETALLES REDISEÑADO (Estilo Suelos) */}
      {selectedPlanting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                {/* Header Verde */}
                <div className="bg-agri-dark p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold flex items-center gap-2">
                        <Sprout size={20}/> Ficha Técnica del Cultivo
                    </h3>
                    <button onClick={() => setSelectedPlanting(null)} className="hover:bg-white/20 p-1 rounded"><X size={24}/></button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Sección Identidad */}
                    <div className="flex justify-between items-start border-b pb-4 border-gray-100">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold tracking-wide">Cultivo & Lote</label>
                            <p className="text-xl font-bold text-gray-800">{selectedPlanting.crop_details?.nombre}</p>
                            <p className="text-sm text-gray-500">{selectedPlanting.nombre_identificativo || 'Sin nombre'}</p>
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold">Activo</span>
                    </div>
                    
                    {/* Grilla de Datos */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <label className="text-xs text-gray-400 uppercase font-bold flex items-center gap-1"><Layers size={12}/> Suelo</label>
                            <p className="font-bold text-amber-700">{selectedPlanting.soil?.nombre || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{selectedPlanting.soil?.textura}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <label className="text-xs text-gray-400 uppercase font-bold flex items-center gap-1"><Map size={12}/> Área</label>
                            <p className="font-bold text-gray-800">{selectedPlanting.area} Ha</p>
                        </div>
                    </div>

                    {/* Coeficientes Kc */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <label className="text-xs text-blue-400 uppercase font-bold mb-3 block flex items-center gap-1"><Ruler size={12}/> Curva de Desarrollo (Kc)</label>
                        <div className="flex justify-between items-end text-center">
                            <div className="flex-1">
                                <div className="h-8 bg-blue-200 w-2 mx-auto rounded-t mb-1"></div>
                                <span className="block font-bold text-blue-900">{selectedPlanting.crop_details?.kc_inicial}</span>
                                <span className="text-[10px] text-blue-500 uppercase">Ini</span>
                            </div>
                            <div className="flex-1">
                                <div className="h-12 bg-blue-300 w-2 mx-auto rounded-t mb-1"></div>
                                <span className="block font-bold text-blue-900">{selectedPlanting.crop_details?.kc_medio}</span>
                                <span className="text-[10px] text-blue-500 uppercase">Med</span>
                            </div>
                            <div className="flex-1">
                                <div className="h-10 bg-blue-200 w-2 mx-auto rounded-t mb-1"></div>
                                <span className="block font-bold text-blue-900">{selectedPlanting.crop_details?.kc_fin}</span>
                                <span className="text-[10px] text-blue-500 uppercase">Fin</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={() => setSelectedPlanting(null)} className="px-5 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-600 transition-colors">Cerrar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}