import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Sprout, Calendar, Map, ArrowRight, Save, AlertCircle, Layers } from 'lucide-react';

export default function NewPlanting() {
  const navigate = useNavigate();
  const location = useLocation(); // Para detectar si venimos a Editar
  
  const [baseCrops, setBaseCrops] = useState([]);
  const [soils, setSoils] = useState([]); // 🟢 Estado para suelos
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    crop: '',        
    nombre: '',      
    fecha_siembra: '',
    area: '',        
    municipio: 'Neiva',
    soil: '' // 🟢 Campo de Suelo
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
        // Cargar catálogos
        const [cropsRes, soilsRes] = await Promise.all([
            api.get('/cultivo/crops/'),
            api.get('/suelo/soils/')
        ]);
        setBaseCrops(cropsRes.data);
        setSoils(soilsRes.data);

        // 🟢 Lógica de Edición: Si pasamos el objeto planting por state
        if (location.state && location.state.plantingToEdit) {
            const p = location.state.plantingToEdit;
            setEditMode(true);
            setEditingId(p.id);
            setFormData({
                crop: p.crop, // ID del tipo de cultivo
                nombre: p.nombre_identificativo || '',
                fecha_siembra: p.fecha_siembra,
                area: p.area,
                municipio: p.ubicacion || 'Neiva',
                soil: p.soil || '' // Cargar suelo si tiene, sino vacío
            });
            toast("Modo Edición Activado", { icon: '✏️' });
        }

    } catch (error) {
        toast.error("Error cargando datos del sistema");
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.crop) return toast.error("Selecciona un cultivo");
    if (!formData.soil) return toast.error("Debes asignar un tipo de suelo"); // 🟢 Validación

    const selectedCropData = baseCrops.find(c => c.id === parseInt(formData.crop));
    if (!selectedCropData) return toast.error("Datos del cultivo base no encontrados");

    setSaving(true);
    try {
      const payload = {
        crop: formData.crop,            
        nombre: formData.nombre,        
        fecha_siembra: formData.fecha_siembra,
        area: parseFloat(formData.area),
        ubicacion: formData.municipio,
        soil: formData.soil, // 🟢 Enviamos el ID del suelo
        
        // Datos Técnicos (necesarios por el backend)
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

      if (editMode) {
          // ACTUALIZAR (PUT/PATCH)
          await api.patch(`/cultivo/plantings/${editingId}/`, payload);
          toast.success('Siembra actualizada correctamente');
      } else {
          // CREAR (POST)
          await api.post('/cultivo/plantings/', payload);
          toast.success('¡Siembra registrada exitosamente!');
      }

      navigate('/home/mis-cultivos');

    } catch (error) {
      console.error(error);
      toast.error("Error al guardar. Revisa que todos los campos sean válidos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-agri-dark flex items-center gap-2">
          <Sprout className="text-agri-green" size={32} />
          {editMode ? 'Editar Siembra' : 'Registrar Nueva Siembra'}
        </h1>
        <p className="text-gray-500">
          {editMode ? 'Modifica los parámetros de tu cultivo.' : 'Inicia un nuevo ciclo productivo.'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="h-2 bg-agri-green w-full"></div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* SELECCIÓN DE CULTIVO */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Cultivo Base (FAO)</label>
            <div className="relative">
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none appearance-none bg-white"
                  value={formData.crop}
                  onChange={(e) => setFormData({...formData, crop: e.target.value})}
                  required
                  disabled={loading}
                >
                  <option value="">-- Selecciona un cultivo --</option>
                  {baseCrops.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} (Kc: {c.kc_medio})</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                  <ArrowRight size={16} className="rotate-90" />
                </div>
            </div>
          </div>

          {/* 🟢 SELECCIÓN DE SUELO (AGREGADO) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Layers size={18} className="text-amber-600"/> Tipo de Suelo Asignado
            </label>
            <div className="relative">
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none appearance-none bg-white"
                  value={formData.soil}
                  onChange={(e) => setFormData({...formData, soil: e.target.value})}
                  required
                  disabled={loading}
                >
                  <option value="">-- Selecciona el suelo del lote --</option>
                  {soils.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre} ({s.textura})</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                  <ArrowRight size={16} className="rotate-90" />
                </div>
            </div>
            {soils.length === 0 && !loading && (
                <p className="text-xs text-red-500 mt-1">⚠️ No tienes suelos registrados. Crea uno primero en la sección Suelos.</p>
            )}
          </div>

          {/* NOMBRE Y UBICACIÓN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nombre Identificador</label>
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
              <label className="block text-sm font-bold text-gray-700 mb-2">Ubicación / Municipio</label>
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
                type="number" step="0.01" placeholder="0.00"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: e.target.value})}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-agri-green hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2"
          >
            {saving ? 'Guardando...' : (
              <>
                <Save size={20} /> {editMode ? 'Actualizar Siembra' : 'Confirmar Siembra'}
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}