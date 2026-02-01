import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Plus, Droplets, Calendar, Edit3, Trash2, Layers, Sprout, X, Ruler, BookOpen } from 'lucide-react'; // 🟢 Icono BookOpen
import { toast } from 'react-hot-toast';

export default function MyCrops() {
  const [plantings, setPlantings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanting, setSelectedPlanting] = useState(null); 
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
    <div className="relative max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-agri-dark">Mis Siembras Activas</h1>
          <p className="text-gray-500 text-sm">Gestiona tus lotes en producción.</p>
        </div>
        
        {/* 🟢 BARRA DE ACCIONES */}
        <div className="flex gap-3">
            <Link 
              to="/home/cultivos-base" 
              className="flex items-center gap-2 bg-white text-agri-dark border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
            >
              <BookOpen size={18} /> Catálogo de Especies
            </Link>
            <Link 
              to="/home/nuevo-cultivo" 
              className="flex items-center gap-2 bg-agri-green text-white px-4 py-2 rounded-lg hover:bg-agri-dark transition-colors shadow-sm font-bold"
            >
              <Plus size={18} /> Nueva Siembra
            </Link>
        </div>
      </div>

      {plantings.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
          <Sprout size={48} className="mx-auto text-gray-300 mb-4"/>
          <p className="text-gray-500 mb-4">No tienes siembras registradas.</p>
          <Link to="/home/nuevo-cultivo" className="text-agri-green font-bold hover:underline">
            ¡Sembrar ahora!
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plantings.map((plant) => (
            <div key={plant.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group relative">
              <div className="flex justify-between items-start mb-4 pr-16">
                <h3 className="text-xl font-bold text-gray-800 line-clamp-1">
                  {plant.crop_details?.nombre || "Cultivo #" + plant.crop}
                </h3>
              </div>
              
              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-agri-green shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Fecha Siembra</p>
                    <span className="font-medium">{plant.fecha_siembra}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Layers size={18} className="text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Suelo</p>
                    <span className="font-medium text-amber-800 line-clamp-1">
                        {plant.soil?.nombre || <span className="text-red-400 font-bold">⚠️ Sin Asignar</span>}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <button 
                  onClick={() => setSelectedPlanting(plant)} // Abrir Modal Detalles
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  Ver Detalles
                </button>
                
                <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(plant)}
                      className="text-gray-400 hover:text-amber-600 p-1 transition-colors"
                      title="Editar"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => handleDelete(plant.id)} className="text-gray-400 hover:text-red-600 p-1 transition-colors" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                    <Link to="/home/riego" className="bg-blue-50 text-blue-700 p-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm font-bold ml-2">
                        <Droplets size={16} /> Riego
                    </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE DETALLES */}
      {selectedPlanting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className="bg-agri-dark p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold flex items-center gap-2">
                        <Sprout size={20}/> Ficha Técnica
                    </h3>
                    <button onClick={() => setSelectedPlanting(null)} className="hover:bg-white/20 p-1 rounded"><X size={24}/></button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Identidad */}
                    <div className="flex justify-between items-start border-b pb-4 border-gray-100">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold tracking-wide">Cultivo</label>
                            <p className="text-xl font-bold text-gray-800">{selectedPlanting.crop_details?.nombre}</p>
                        </div>
                        <div className="text-right">
                             <label className="text-xs text-gray-400 uppercase font-bold tracking-wide">Área</label>
                             <p className="text-lg font-bold text-gray-800">{selectedPlanting.area} Ha</p>
                        </div>
                    </div>
                    
                    {/* Info Suelo */}
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <label className="text-xs text-amber-800 uppercase font-bold flex items-center gap-1 mb-1"><Layers size={12}/> Suelo Asignado</label>
                        <p className="font-bold text-gray-800">{selectedPlanting.soil?.nombre || 'No asignado'}</p>
                        <p className="text-xs text-gray-500">{selectedPlanting.soil?.textura} • Infiltración: {selectedPlanting.soil?.tasa_max_infiltracion} mm/h</p>
                    </div>

                    {/* Coeficientes Kc (Visual) */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <label className="text-xs text-blue-400 uppercase font-bold mb-3 block flex items-center gap-1"><Ruler size={12}/> Curva Kc</label>
                        <div className="flex justify-between items-end text-center text-sm">
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-blue-900">{selectedPlanting.crop_details?.kc_inicial}</span>
                                <span className="text-[10px] text-blue-500 uppercase">Inicio</span>
                            </div>
                            <div className="h-1 bg-blue-200 flex-1 mx-2 mb-4 relative">
                                <div className="absolute -top-1 right-0 w-2 h-2 bg-blue-300 rounded-full"></div>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-blue-900">{selectedPlanting.crop_details?.kc_medio}</span>
                                <span className="text-[10px] text-blue-500 uppercase">Medio</span>
                            </div>
                            <div className="h-1 bg-blue-200 flex-1 mx-2 mb-4 relative">
                                <div className="absolute -top-1 right-0 w-2 h-2 bg-blue-300 rounded-full"></div>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-blue-900">{selectedPlanting.crop_details?.kc_fin}</span>
                                <span className="text-[10px] text-blue-500 uppercase">Fin</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}