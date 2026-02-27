import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { 
  Settings as SettingsIcon, Save, Sliders, CloudRain, Droplets, Info, TreePine
} from 'lucide-react';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Opciones traídas del Backend (Listas vacías iniciales)
  const [availableOptions, setAvailableOptions] = useState({
    eto_methods: [],
    rain_methods: []
  });

  // Estado del formulario
  const [formData, setFormData] = useState({
    id: null,
    preferred_eto_method: '',
    effective_rain_method: '',
    system_efficiency: 0.90,
    experience_criterion: 80.0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 1. Cargamos las opciones disponibles Y la configuración actual en paralelo
      const [choicesRes, settingsRes] = await Promise.all([
        api.get('/settings/choices/'),
        api.get('/settings/')
      ]);

      setAvailableOptions(choicesRes.data);

      if (settingsRes.data && settingsRes.data.length > 0) {
        setFormData(settingsRes.data[0]);
      } else {
        // Defaults si es usuario nuevo
        setFormData(prev => ({
          ...prev,
          preferred_eto_method: choicesRes.data.eto_methods[0]?.value || 'HARGREAVES',
          effective_rain_method: choicesRes.data.rain_methods[0]?.value || 'USDA'
        }));
      }
    } catch (error) {
      console.error(error);
      toast.error("Error cargando datos del servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (formData.id) {
        await api.patch(`/settings/${formData.id}/`, formData);
        toast.success("Preferencias actualizadas");
      } else {
        const res = await api.post('/settings/', formData);
        setFormData(res.data);
        toast.success("Configuración creada");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando catálogo de fórmulas...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-agri-dark flex items-center gap-3">
          <SettingsIcon className="text-gray-600" size={36} />
          Configuración Agronómica
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Personaliza el motor de cálculo según tu infraestructura.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* TARJETA 1: MÉTODO DE LLUVIA (Renderizado Dinámico) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <CloudRain size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-700">Lluvia Efectiva</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Selecciona la fórmula para descontar la lluvia del riego necesario.
          </p>

          <div className="space-y-4">
            {availableOptions.rain_methods.map((method) => (
              <label 
                key={method.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  formData.effective_rain_method === method.value 
                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
              >
                <input 
                  type="radio" 
                  name="rain_method" 
                  value={method.value}
                  checked={formData.effective_rain_method === method.value}
                  onChange={(e) => setFormData({...formData, effective_rain_method: e.target.value})}
                  className="mt-1 accent-blue-600"
                />
                <div>
                  <span className="font-bold text-gray-800 block">{method.label}</span>
                  {/* Descripción condicional pequeña según el método */}
                  <span className="text-xs text-gray-500">
                    {method.value === 'USDA' && "Recomendado. Penaliza lluvias torrenciales (escorrentía)."}
                    {method.value === 'FIXED' && "Simple. Asume un % fijo de aprovechamiento."}
                    {method.value === 'DEPENDABLE' && "Conservador. Ideal para planificación a largo plazo."}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* TARJETA 2: EFICIENCIA (Slider) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-2 rounded-lg text-green-600">
              <Droplets size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-700">Eficiencia del Riego</h3>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between mb-4">
              <label className="text-sm font-bold text-gray-700">Factor de Eficiencia</label>
              <span className={`text-lg font-mono font-bold px-3 py-1 rounded ${
                formData.system_efficiency >= 0.9 ? 'bg-green-100 text-green-700' :
                formData.system_efficiency >= 0.7 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {(formData.system_efficiency * 100).toFixed(0)}%
              </span>
            </div>
            <input 
              type="range" 
              min="0.40" 
              max="1.00" 
              step="0.05"
              value={formData.system_efficiency}
              onChange={(e) => setFormData({...formData, system_efficiency: parseFloat(e.target.value)})}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
              <span>40% (Inundación)</span>
              <span>75% (Aspersión)</span>
              <span>95% (Goteo)</span>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex gap-3">
            <Info className="text-yellow-600 shrink-0" size={20} />
            <p className="text-xs text-yellow-800">
              <strong>Impacto Real:</strong> Si la planta pide 10mm, el sistema te mandará aplicar 
              <strong> {(10 / formData.system_efficiency).toFixed(1)} mm</strong>.
            </p>
          </div>
        </div>
        {/* Criterio de experiencia*/}     
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
           <div className="flex items-center gap-3 mb-4"><div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><TreePine size={24} /></div><h3 className="text-lg font-bold text-gray-700">Criterio de Experiencia (Área de Sombra)</h3></div>
           <p className="text-sm text-gray-500 mb-4">Define qué porcentaje de la distancia entre plantas ocupa el diámetro del cultivo. Este valor se usa para calcular los Litros por planta (Traslape).</p>
           <div className="flex items-center gap-4">
               <input type="number" step="1" min="1" max="200" value={formData.experience_criterion} onChange={(e) => setFormData({...formData, experience_criterion: parseFloat(e.target.value)})} className="w-32 p-3 border border-gray-300 rounded-lg text-xl font-bold text-center" />
               <span className="text-gray-600 font-bold">% de la distancia</span>
           </div>
        </div>

        {/* TARJETA 3: MÉTODO ETo (Select Dinámico) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
              <Sliders size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-700">Fórmula de Evapotranspiración (ETo)</h3>
          </div>
          <div className="mt-4">
            <select 
              value={formData.preferred_eto_method}
              onChange={(e) => setFormData({...formData, preferred_eto_method: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            >
              {availableOptions.eto_methods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-2 ml-1">
              * Hargreaves es ideal si solo tienes datos de temperatura. Penman requiere estación completa.
            </p>
          </div>
        </div>

        {/* BOTÓN GUARDAR */}
        <div className="md:col-span-2 flex justify-end pb-8">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-agri-dark hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold shadow-xl flex items-center gap-3 transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
          >
            {saving ? 'Guardando...' : <><Save size={22} /> Guardar Preferencias</>}
          </button>
        </div>

      </form>
    </div>
  );
}