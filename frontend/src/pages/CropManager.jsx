import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 🟢 Importar hook de navegación
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { 
  Sprout, Plus, Save, X, Globe, User, Ruler, Calendar, 
  ArrowLeft, Info, Activity, BarChart3 
} from 'lucide-react';

export default function CropManager() {
  const [crops, setCrops] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // 🟢 NUEVO ESTADO: Cultivo seleccionado para ver detalles
  const [selectedCrop, setSelectedCrop] = useState(null);
  
  const navigate = useNavigate(); // 🟢 Hook para navegar

  const [formData, setFormData] = useState({
    nombre: '',
    kc_inicial: '', kc_medio: '', kc_fin: '',
    etapa_inicial: '', etapa_desarrollo: '', etapa_medio: '', etapa_final: '',
    prof_radicular_ini: '0.2', prof_radicular_max: '1.0',
    agotam_critico: '0.5', factor_respuesta_rend: '1.0', altura_max: '1.5'
  });

  useEffect(() => { loadCrops(); }, []);

  const loadCrops = async () => {
      try {
          const res = await api.get('/cultivo/crops/'); 
          setCrops(res.data);
      } catch (error) { toast.error("Error cargando cultivos"); }
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          await api.post('/cultivo/crops/', formData);
          toast.success("Cultivo personalizado creado");
          setShowCreateModal(false);
          loadCrops();
          setFormData({
            nombre: '', kc_inicial: '', kc_medio: '', kc_fin: '',
            etapa_inicial: '', etapa_desarrollo: '', etapa_medio: '', etapa_final: '',
            prof_radicular_ini: '0.2', prof_radicular_max: '1.0',
            agotam_critico: '0.5', factor_respuesta_rend: '1.0', altura_max: '1.5'
          });
      } catch (error) {
          toast.error("Error guardando cultivo. Verifique los campos.");
      }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 pb-12">
      
      {/* HEADER CON NAVEGACIÓN */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b pb-4 gap-4">
        <div className="flex items-center gap-3">
            {/* 🟢 BOTÓN VOLVER */}
            <button 
                onClick={() => navigate('/home/mis-cultivos')}
                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors text-gray-600"
                title="Volver a Mis Cultivos"
            >
                <ArrowLeft size={24} />
            </button>
            
            <div>
                <h1 className="text-2xl font-bold text-agri-dark flex gap-2 items-center">
                    <Sprout className="text-green-600"/> Catálogo de Especies
                </h1>
                <p className="text-gray-500 text-sm">Base de datos técnica de cultivos.</p>
            </div>
        </div>
        
        <button 
            onClick={() => setShowCreateModal(true)} 
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex gap-2 items-center hover:bg-green-700 shadow-md transition-transform active:scale-95"
        >
            <Plus size={20}/> Nuevo Cultivo Base
        </button>
      </div>

      {/* LISTA DE CULTIVOS (TARJETAS CLICKEABLES) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {crops.map(crop => (
              <div 
                key={crop.id} 
                onClick={() => setSelectedCrop(crop)} // 🟢 ABRIR MODAL AL CLICK
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-green-300 transition-all cursor-pointer relative overflow-hidden group"
              >
                  {/* Badge Tipo */}
                  <div className={`absolute top-0 right-0 px-2 py-1 rounded-bl-lg text-[10px] font-bold text-white flex items-center gap-1 ${crop.user === null ? 'bg-blue-400' : 'bg-green-500'}`}>
                      {crop.user === null ? <><Globe size={10}/> FAO</> : <><User size={10}/> MÍO</>}
                  </div>

                  <h3 className="font-bold text-gray-800 text-lg mb-3 pr-16 flex items-center gap-2 group-hover:text-green-700 transition-colors">
                      {crop.nombre}
                  </h3>
                  
                  {/* Resumen Rápido */}
                  <div className="space-y-2 text-xs">
                      <div className="flex justify-between bg-blue-50 p-2 rounded text-blue-800">
                          <span className="font-semibold">Kc Promedio:</span>
                          <span>{((crop.kc_inicial + crop.kc_medio + crop.kc_fin)/3).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between bg-green-50 p-2 rounded text-green-800">
                          <span className="font-semibold">Ciclo Total:</span>
                          <span>{crop.etapa_inicial + crop.etapa_desarrollo + crop.etapa_medio + crop.etapa_final} días</span>
                      </div>
                  </div>
                  
                  <div className="mt-3 text-center text-xs text-gray-400 font-medium group-hover:text-green-600 transition-colors">
                      Click para ver ficha técnica completa
                  </div>
              </div>
          ))}
      </div>

      {/* 🟢 MODAL DE DETALLES DEL CULTIVO */}
      {selectedCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                {/* Header Modal */}
                <div className="bg-gradient-to-r from-green-700 to-green-600 p-5 flex justify-between items-center text-white">
                    <div>
                        <h3 className="font-bold text-xl flex items-center gap-2">
                            <Sprout size={24}/> {selectedCrop.nombre}
                        </h3>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-green-50">
                            {selectedCrop.user === null ? 'Catálogo Global (FAO)' : 'Cultivo Personalizado'}
                        </span>
                    </div>
                    <button onClick={() => setSelectedCrop(null)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={24}/></button>
                </div>
                
                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    
                    {/* Sección 1: Coeficientes Kc */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <label className="text-xs text-blue-500 uppercase font-bold mb-3 flex items-center gap-1">
                            <Activity size={14}/> Coeficientes de Cultivo (Kc)
                        </label>
                        <div className="flex justify-between items-end text-center relative px-2">
                            {/* Línea conectora visual */}
                            <div className="absolute bottom-4 left-4 right-4 h-0.5 bg-blue-200 -z-0"></div>
                            
                            <div className="z-10 bg-blue-50">
                                <span className="block font-bold text-blue-900 text-lg">{selectedCrop.kc_inicial}</span>
                                <span className="text-[10px] text-blue-500 uppercase font-bold bg-blue-100 px-2 py-0.5 rounded">Inicial</span>
                            </div>
                            <div className="z-10 bg-blue-50 pb-4">
                                <span className="block font-bold text-blue-900 text-xl">{selectedCrop.kc_medio}</span>
                                <span className="text-[10px] text-blue-500 uppercase font-bold bg-blue-100 px-2 py-0.5 rounded">Medio</span>
                            </div>
                            <div className="z-10 bg-blue-50">
                                <span className="block font-bold text-blue-900 text-lg">{selectedCrop.kc_fin}</span>
                                <span className="text-[10px] text-blue-500 uppercase font-bold bg-blue-100 px-2 py-0.5 rounded">Final</span>
                            </div>
                        </div>
                    </div>

                    {/* Sección 2: Ciclo Fenológico */}
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <label className="text-xs text-green-600 uppercase font-bold mb-3 flex items-center gap-1">
                            <Calendar size={14}/> Ciclo Fenológico (Días)
                        </label>
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="bg-white p-2 rounded border border-green-100">
                                <span className="block font-bold text-green-800">{selectedCrop.etapa_inicial}</span>
                                <span className="text-[9px] text-gray-400 uppercase">Inicial</span>
                            </div>
                            <div className="bg-white p-2 rounded border border-green-100">
                                <span className="block font-bold text-green-800">{selectedCrop.etapa_desarrollo}</span>
                                <span className="text-[9px] text-gray-400 uppercase">Desarrollo</span>
                            </div>
                            <div className="bg-white p-2 rounded border border-green-100">
                                <span className="block font-bold text-green-800">{selectedCrop.etapa_medio}</span>
                                <span className="text-[9px] text-gray-400 uppercase">Media</span>
                            </div>
                            <div className="bg-white p-2 rounded border border-green-100">
                                <span className="block font-bold text-green-800">{selectedCrop.etapa_final}</span>
                                <span className="text-[9px] text-gray-400 uppercase">Final</span>
                            </div>
                        </div>
                        <div className="mt-3 text-center border-t border-green-200 pt-2">
                            <span className="text-xs text-green-700 font-bold">
                                Ciclo Total: {selectedCrop.etapa_inicial + selectedCrop.etapa_desarrollo + selectedCrop.etapa_medio + selectedCrop.etapa_final} días
                            </span>
                        </div>
                    </div>

                    {/* Sección 3: Datos Físicos */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label className="text-xs text-gray-400 uppercase font-bold flex items-center gap-1 mb-2"><Ruler size={12}/> Prof. Radicular</label>
                            <div className="flex justify-between text-sm">
                                <span>Inicial:</span> <span className="font-bold text-gray-700">{selectedCrop.prof_radicular_ini} m</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Máxima:</span> <span className="font-bold text-gray-700">{selectedCrop.prof_radicular_max} m</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label className="text-xs text-gray-400 uppercase font-bold flex items-center gap-1 mb-2"><BarChart3 size={12}/> Parámetros</label>
                            <div className="flex justify-between text-sm">
                                <span title="Factor Agotamiento">Factor p:</span> <span className="font-bold text-gray-700">{selectedCrop.agotam_critico}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Altura Max:</span> <span className="font-bold text-gray-700">{selectedCrop.altura_max} m</span>
                            </div>
                        </div>
                    </div>

                </div>
                
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button 
                        onClick={() => setSelectedCrop(null)} 
                        className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-bold text-gray-600 transition-colors shadow-sm"
                    >
                        Cerrar Ficha
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL CREACIÓN (Sin cambios, solo controlado por showCreateModal) */}
      {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                  <div className="bg-green-600 p-4 flex justify-between items-center text-white sticky top-0 z-10">
                      <h3 className="font-bold text-lg flex items-center gap-2"><Plus size={20}/> Registrar Nueva Especie</h3>
                      <button onClick={() => setShowCreateModal(false)} className="hover:bg-white/20 p-1 rounded"><X/></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                      {/* ... (Mismo formulario de antes) ... */}
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Común</label>
                          <input type="text" required placeholder="Ej: Tomate Cherry" className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})}/>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2"><Ruler size={16}/> Coeficientes de Cultivo (Kc)</h4>
                          <div className="grid grid-cols-3 gap-4">
                              <div><label className="text-xs font-bold text-blue-600 block mb-1">Kc Inicial</label><input type="number" step="0.01" required className="w-full border p-2 rounded bg-white" value={formData.kc_inicial} onChange={e => setFormData({...formData, kc_inicial: e.target.value})}/></div>
                              <div><label className="text-xs font-bold text-blue-600 block mb-1">Kc Medio</label><input type="number" step="0.01" required className="w-full border p-2 rounded bg-white" value={formData.kc_medio} onChange={e => setFormData({...formData, kc_medio: e.target.value})}/></div>
                              <div><label className="text-xs font-bold text-blue-600 block mb-1">Kc Final</label><input type="number" step="0.01" required className="w-full border p-2 rounded bg-white" value={formData.kc_fin} onChange={e => setFormData({...formData, kc_fin: e.target.value})}/></div>
                          </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                          <h4 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2"><Calendar size={16}/> Duración de Etapas (Días)</h4>
                          <div className="grid grid-cols-4 gap-2">
                              <div><label className="text-[10px] font-bold text-green-700 block mb-1">Inicial</label><input type="number" required className="w-full border p-2 rounded text-sm bg-white" value={formData.etapa_inicial} onChange={e => setFormData({...formData, etapa_inicial: e.target.value})}/></div>
                              <div><label className="text-[10px] font-bold text-green-700 block mb-1">Desarrollo</label><input type="number" required className="w-full border p-2 rounded text-sm bg-white" value={formData.etapa_desarrollo} onChange={e => setFormData({...formData, etapa_desarrollo: e.target.value})}/></div>
                              <div><label className="text-[10px] font-bold text-green-700 block mb-1">Media</label><input type="number" required className="w-full border p-2 rounded text-sm bg-white" value={formData.etapa_medio} onChange={e => setFormData({...formData, etapa_medio: e.target.value})}/></div>
                              <div><label className="text-[10px] font-bold text-green-700 block mb-1">Final</label><input type="number" required className="w-full border p-2 rounded text-sm bg-white" value={formData.etapa_final} onChange={e => setFormData({...formData, etapa_final: e.target.value})}/></div>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-xs font-bold text-gray-500 block mb-1">Prof. Raíz Max (m)</label><input type="number" step="0.1" required className="w-full border p-2 rounded" value={formData.prof_radicular_max} onChange={e => setFormData({...formData, prof_radicular_max: e.target.value})}/></div>
                          <div><label className="text-xs font-bold text-gray-500 block mb-1">Factor Agotamiento (p)</label><input type="number" step="0.05" required className="w-full border p-2 rounded" value={formData.agotam_critico} onChange={e => setFormData({...formData, agotam_critico: e.target.value})}/></div>
                      </div>

                      <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow hover:bg-green-700 flex justify-center items-center gap-2">
                          <Save size={20}/> Guardar en Catálogo
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}