import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Sprout, Calendar, Map, ArrowRight, Save, AlertCircle } from 'lucide-react';

export default function NewPlanting() {
  const navigate = useNavigate();
  
  const [baseCrops, setBaseCrops] = useState([]);
  const [loadingCrops, setLoadingCrops] = useState(true);

  const [formData, setFormData] = useState({
    crop: '',        
    nombre: '',      
    fecha_siembra: '',
    area: '',        
    municipio: 'Neiva' 
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const res = await api.get('/cultivo/crops/');
        setBaseCrops(res.data);
      } catch (error) {
        console.error("Error cargando cultivos:", error);
        toast.error("No se pudo cargar el catálogo de cultivos");
      } finally {
        setLoadingCrops(false);
      }
    };
    fetchCrops();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.crop) {
      toast.error("Por favor selecciona un cultivo");
      return;
    }

    // 1. BUSCAR EL CULTIVO COMPLETO EN MEMORIA
    // Necesitamos extraer sus datos técnicos para enviarlos al backend
    const selectedCropData = baseCrops.find(c => c.id === parseInt(formData.crop));

    if (!selectedCropData) {
      toast.error("Error interno: Datos del cultivo no encontrados");
      return;
    }

    setSaving(true);
    try {
      // 2. PREPARAR EL PAYLOAD (Fusión de datos)
      // El backend exige todos los campos técnicos para guardar una "copia" independiente
      const payload = {
        // Datos del usuario
        crop: formData.crop,            
        nombre: formData.nombre,        
        fecha_siembra: formData.fecha_siembra,
        area: parseFloat(formData.area),
        ubicacion: formData.municipio,
        
        // Datos Técnicos (Copiados del catálogo base)
        kc_inicial: selectedCropData.kc_inicial,
        kc_medio: selectedCropData.kc_medio,
        kc_fin: selectedCropData.kc_fin,
        etapa_inicial: selectedCropData.etapa_inicial,
        etapa_desarrollo: selectedCropData.etapa_desarrollo,
        etapa_medio: selectedCropData.etapa_medio,
        etapa_final: selectedCropData.etapa_final,
        agotam_critico: selectedCropData.agotam_critico,
        factor_respuesta_rend: selectedCropData.factor_respuesta_rend,
        altura_max: selectedCropData.altura_max,
        prof_radicular_ini: selectedCropData.prof_radicular_ini,
        prof_radicular_max: selectedCropData.prof_radicular_max,
      };

      // 3. ENVIAR TODO AL ENDPOINT
      await api.post('/cultivo/plantings/', payload);

      toast.success('¡Siembra registrada exitosamente!');
      navigate('/home/mis-cultivos');

    } catch (error) {
      console.error("Error detallado:", error.response?.data);
      
      const serverError = error.response?.data;
      const msg = typeof serverError === 'object' 
        ? Object.entries(serverError).map(([key, val]) => `${key}: ${val}`).join(', ')
        : serverError?.detail || "Error al guardar la siembra";
      
      toast.error("Error de validación: Revisa la consola para más detalles");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-agri-dark flex items-center gap-2">
          <Sprout className="text-agri-green" size={32} />
          Registrar Nueva Siembra
        </h1>
        <p className="text-gray-500">
          Inicia un nuevo ciclo productivo.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="h-2 bg-agri-green w-full"></div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* SELECCIÓN DE CULTIVO */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Cultivo Base (Catálogo FAO)
            </label>
            {loadingCrops ? (
              <div className="animate-pulse h-10 bg-gray-100 rounded"></div>
            ) : (
              <div className="relative">
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none appearance-none bg-white"
                  value={formData.crop}
                  onChange={(e) => setFormData({...formData, crop: e.target.value})}
                  required
                >
                  <option value="">-- Selecciona un cultivo --</option>
                  {baseCrops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (Kc: {c.kc_medio})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                  <ArrowRight size={16} className="rotate-90" />
                </div>
              </div>
            )}
          </div>

          {/* NOMBRE Y UBICACIÓN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Identificador / Nombre
              </label>
              <input
                type="text"
                placeholder="Ej: Lote Maíz Sur"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Ubicación / Municipio
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.municipio}
                onChange={(e) => setFormData({...formData, municipio: e.target.value})}
              />
            </div>
          </div>

          {/* FECHA Y ÁREA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={18} className="text-blue-500"/> Fecha de Siembra
              </label>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.fecha_siembra}
                onChange={(e) => setFormData({...formData, fecha_siembra: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Map size={18} className="text-green-600"/> Área Sembrada (Ha)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 items-start">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-yellow-800">
              <strong>Nota importante:</strong> Recuerda registrar el suelo asociado más adelante para cálculos precisos.
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-agri-green hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2"
          >
            {saving ? 'Guardando...' : (
              <>
                <Save size={20} /> Confirmar Siembra
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}