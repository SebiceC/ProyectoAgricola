import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { 
  CloudSun, Thermometer, Wind, Droplets, Calendar, 
  Save, RefreshCw, MapPin, CheckCircle, Info 
} from 'lucide-react';

export default function ClimateEto() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // LÓGICA DE FECHAS: Restamos 2 días para asegurar datos NASA disponibles
  const getMaxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 2); 
    return d.toISOString().split('T')[0];
  };
  const [selectedDate, setSelectedDate] = useState(getMaxDate());

  // Estado del Clima (Lat/Lon por defecto de Neiva, pero editables)
  const [weatherData, setWeatherData] = useState({
    id: null,
    temp_max: '',
    temp_min: '',
    humidity_mean: '',
    wind_speed: '',
    solar_rad: '',
    eto_mm: '',
    source: '',
    latitude: 2.92, 
    longitude: -75.28
  });

  useEffect(() => {
    fetchWeatherData();
  }, [selectedDate]); // Al cambiar fecha, recarga automático

  const fetchWeatherData = async () => {
    setLoading(true);
    try {
      // Enviamos las coordenadas actuales del formulario para pedir el clima de ESA zona
      const res = await api.get(`/weather/fetch_for_date/`, {
        params: {
          date: selectedDate,
          lat: weatherData.latitude,
          lon: weatherData.longitude
        }
      });
      
      setWeatherData(prev => ({
        ...prev,
        ...res.data,
        // 🛡️ PROTECCIÓN CRÍTICA: Si el backend devuelve null (error NASA), mantenemos lo que escribió el usuario
        latitude: res.data.latitude || prev.latitude,
        longitude: res.data.longitude || prev.longitude,
        // Evitar nulos en inputs numéricos
        temp_max: res.data.temp_max ?? '',
        temp_min: res.data.temp_min ?? '',
        eto_mm: res.data.eto_mm ?? ''
      }));

    } catch (error) {
      console.error(error);
      toast.error("No se pudieron obtener datos para esta fecha/ubicación.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
        const payload = {
            ...weatherData,
            source: 'MANUAL',
            date: selectedDate
        };

        if (weatherData.id) {
            await api.patch(`/weather/${weatherData.id}/`, payload);
        } else {
            await api.post(`/weather/`, payload);
        }
        
        toast.success("Datos corregidos y guardados.");
        fetchWeatherData(); 

    } catch (error) {
        console.error(error);
        toast.error("Error al guardar corrección.");
    } finally {
        setSaving(false);
    }
  };

  const isManual = weatherData.source === 'MANUAL' || weatherData.source === 'STATION';

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12">
      
      <div className="mb-8 border-b pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-agri-dark flex items-center gap-3">
            <CloudSun className="text-orange-500" size={36} />
            Monitor Climático (ETo)
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Consulta y calibra los datos meteorológicos.
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <Calendar size={20} className="text-gray-400" />
            <input 
                type="date" 
                value={selectedDate}
                max={getMaxDate()} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="outline-none text-gray-700 font-medium cursor-pointer"
            />
            </div>
            <p className="text-[10px] text-orange-500 flex items-center gap-1 font-medium">
                <Info size={10} /> Datos satelitales disponibles hasta hace 48h
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQ: CONTROL DE UBICACIÓN */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Tarjeta de Estado */}
          <div className={`p-6 rounded-2xl border-2 ${isManual ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Fuente de Datos</h3>
            <div className="flex items-center gap-3">
                {isManual ? <CheckCircle className="text-green-600" size={32}/> : <CloudSun className="text-blue-600" size={32}/>}
                <div>
                    <span className={`text-xl font-bold ${isManual ? 'text-green-800' : 'text-blue-800'}`}>
                        {isManual ? 'Datos Manuales' : 'Satelital (NASA)'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                        {isManual ? 'Validado por usuario.' : 'Estimación remota.'}
                    </p>
                </div>
            </div>
          </div>

          {/* Tarjeta de Ubicación Editable */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
                <MapPin size={18} /> Coordenadas de Cálculo
            </h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 block mb-1">Latitud</label>
                    <input 
                        type="number" 
                        step="0.0001"
                        value={weatherData.latitude}
                        onChange={(e) => setWeatherData({...weatherData, latitude: parseFloat(e.target.value)})}
                        className="w-full bg-white border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 block mb-1">Longitud</label>
                    <input 
                        type="number" 
                        step="0.0001"
                        value={weatherData.longitude}
                        onChange={(e) => setWeatherData({...weatherData, longitude: parseFloat(e.target.value)})}
                        className="w-full bg-white border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                </div>
            </div>
            <button 
                onClick={fetchWeatherData}
                className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
                <RefreshCw size={14}/> Recalcular para esta zona
            </button>
          </div>
        </div>

        {/* COLUMNA DER: FORMULARIO */}
        <form onSubmit={handleSave} className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden">
            {loading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex justify-center items-center">
                    <div className="animate-spin text-agri-green"><RefreshCw size={32}/></div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Variables Atmosféricas</h3>
                <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">ID: {weatherData.id || 'Nuevo'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Thermometer size={16} className="text-red-500"/> Temp. Máxima (°C)
                    </label>
                    <input 
                        type="number" step="0.1" 
                        value={weatherData.temp_max} 
                        onChange={(e) => setWeatherData({...weatherData, temp_max: e.target.value})} 
                        className="w-full p-3 border rounded-lg font-mono text-lg outline-none focus:border-agri-green" 
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Thermometer size={16} className="text-blue-500"/> Temp. Mínima (°C)
                    </label>
                    <input 
                        type="number" step="0.1" 
                        value={weatherData.temp_min} 
                        onChange={(e) => setWeatherData({...weatherData, temp_min: e.target.value})} 
                        className="w-full p-3 border rounded-lg font-mono text-lg outline-none focus:border-agri-green" 
                    />
                </div>
                <div className="md:col-span-2 bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Droplets size={24} /></div>
                        <div>
                            <label className="text-sm font-bold text-orange-800 block">ETo Calculada (mm/día)</label>
                            <span className="text-xs text-orange-600">Evapotranspiración de Referencia</span>
                        </div>
                    </div>
                    <div className="relative">
                        <input 
                            type="number" step="0.01" 
                            value={weatherData.eto_mm} 
                            onChange={(e) => setWeatherData({...weatherData, eto_mm: e.target.value})} 
                            className="w-32 text-right p-2 border border-orange-300 rounded bg-white font-bold text-2xl text-gray-800 outline-none focus:ring-2 focus:ring-orange-200" 
                        />
                        <span className="absolute right-[-25px] top-4 text-gray-400 text-xs">mm</span>
                    </div>
                </div>
            </div>

            <div className="border-t pt-6 flex justify-end gap-3">
                <button type="submit" disabled={saving} className="px-6 py-3 bg-agri-dark hover:bg-slate-800 text-white font-bold rounded-lg shadow-md flex items-center gap-2 transition-all">
                    {saving ? 'Guardando...' : <><Save size={20} /> Guardar Corrección</>}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}