import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { 
  CloudSun, Thermometer, Droplets, Calendar, 
  Save, RefreshCw, Wind, Sun, Calculator,
  Satellite, Edit3, MapPin, AlertTriangle, Info 
} from 'lucide-react';
import { inputToApiFormat } from '../utils/dateUtils';

export default function ClimateEto() {
  const [mode, setMode] = useState('SATELLITE'); 
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const NASA_LAG_DAYS = 4; 

  // 🟢 1. Estado para almacenar las fórmulas traídas del backend
  const [availableMethods, setAvailableMethods] = useState([]);
  
  // Configuración de campos (Esto sí lo dejamos estático en el front porque es lógica de UI: qué mostrar)
  // Pero las 'keys' ('PENMAN', 'HARGREAVES') deben coincidir con lo que traiga el backend.
  const FIELD_MAPPING = {
      'PENMAN': ['temp', 'humidity', 'wind', 'solar'],
      'HARGREAVES': ['temp'],
      'TURC': ['temp', 'humidity', 'solar'],
      'MAKKINK': ['temp', 'solar'],
      'CHRISTIANSEN': ['temp', 'humidity', 'wind', 'solar'],
      'IVANOV': ['temp', 'humidity'],
      'SIMPLE_ABSTEW': ['temp', 'solar'],
  };

  const [weatherData, setWeatherData] = useState({
    id: null,
    method_used: 'PENMAN', // Default, se sobreescribirá al cargar opciones
    temp_max: '', temp_min: '', humidity: '', wind_speed: '', solar_rad: '', eto_mm: '',
    latitude: 2.92, 
    longitude: -75.28,
    source: 'SATELLITE'
  });

  const isRecentDate = () => {
      const today = new Date();
      const sel = new Date(selectedDate);
      const diffTime = Math.abs(today - sel);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays < NASA_LAG_DAYS;
  };

  const shouldShow = (fieldGroup) => {
      // Usamos el mapeo local para saber qué pintar
      const requiredFields = FIELD_MAPPING[weatherData.method_used] || FIELD_MAPPING['PENMAN'];
      return requiredFields.includes(fieldGroup);
  };

  // 🟢 2. Cargar Opciones del Backend al iniciar
  useEffect(() => {
    const loadSettings = async () => {
        try {
            // Hacemos ambas peticiones en paralelo
            const [choicesRes, settingsRes] = await Promise.all([
                api.get('/settings/choices/'),
                api.get('/settings/')
            ]);
            
            // 1. Llenamos el select
            setAvailableMethods(choicesRes.data.eto_methods);

            // 2. Si el usuario tiene una configuración guardada, la aplicamos como default
            if (settingsRes.data && settingsRes.data.length > 0) {
                const userPref = settingsRes.data[0].preferred_eto_method;
                setWeatherData(prev => ({
                    ...prev,
                    method_used: userPref // ¡Esto arregla que siempre salga Penman!
                }));
            }
        } catch (error) {
            console.error("Error cargando configuración inicial", error);
        }
    };
    loadSettings();
  }, []);

  useEffect(() => { loadExistingData(); }, [selectedDate]);

  const loadExistingData = async () => {
    setLoading(true);
    try {
        const res = await api.get(`/weather/fetch_for_date/`, {
            params: { 
                date: inputToApiFormat(selectedDate), 
                lat: weatherData.latitude, 
                lon: weatherData.longitude 
            }
        });
        if (res.data.id || res.data.eto_mm) {
            setWeatherData(prev => ({
                ...prev,
                ...res.data,
                // 🟢 MAPEO CRÍTICO: Backend (humidity_mean) -> Frontend (humidity)
                humidity: res.data.humidity_mean ?? res.data.humidity ?? '', 
                // Asegurar otros campos
                temp_max: res.data.temp_max ?? '',
                temp_min: res.data.temp_min ?? '',
                wind_speed: res.data.wind_speed ?? '',
                solar_rad: res.data.solar_rad ?? '',
                eto_mm: res.data.eto_mm ?? '',
                method_used: res.data.method_used || prev.method_used || 'PENMAN'
            }));
            setMode(res.data.source === 'MANUAL' ? 'MANUAL' : 'SATELLITE');
        } else {
            resetValues();
        }
    } catch (e) { resetValues(); }
    finally { setLoading(false); }
  };

  const resetValues = () => {
      setWeatherData(prev => ({
          ...prev, id: null, eto_mm: '', source: 'SATELLITE',
          temp_max: '', temp_min: '', humidity: '', wind_speed: '', solar_rad: ''
      }));
  };

  const handleSatelliteSync = async () => {
    setLoading(true);
    try {
        const res = await api.post(`/weather/sync_nasa/`, {
            date: inputToApiFormat(selectedDate),
            lat: weatherData.latitude,
            lon: weatherData.longitude,
            method: weatherData.method_used 
        });
        
        setWeatherData(prev => ({ ...prev, ...res.data, humidity: res.data.humidity_mean ?? res.data.humidity ?? '', source: 'SATELLITE' }));
        toast.success(`Datos NASA obtenidos. ETo: ${res.data.eto_mm} mm`);
    } catch (error) {
        toast.error("Error conectando con NASA POWER.");
    } finally {
        setLoading(false);
    }
  };

  const handleManualCalculate = async () => {
      setCalculating(true);
      try {
          // 🟢 USAMOS cleanPayload AQUÍ TAMBIÉN
          const rawData = {
              ...weatherData,
              method: weatherData.method_used,
              date: inputToApiFormat(selectedDate)
          };
          const payload = cleanPayload(rawData);

          const res = await api.post('/weather/preview/', payload);
          setWeatherData(prev => ({ ...prev, eto_mm: res.data.eto }));
          toast.success(`Cálculo: ${res.data.eto} mm`);
      } catch (error) { 
          toast.error("Error en cálculo manual."); 
      } 
      finally { setCalculating(false); }
  };

  const handleSave = async () => {
      if (!weatherData.eto_mm) return toast.error("Sin ETo para guardar");
      setSaving(true);
      try {
          // 🟢 USAMOS cleanPayload AQUÍ
          const rawData = { ...weatherData, source: mode, date: inputToApiFormat(selectedDate) };
          const payload = cleanPayload(rawData);

          if (weatherData.id) await api.patch(`/weather/${weatherData.id}/`, payload);
          else await api.post(`/weather/`, payload);
          
          toast.success("Guardado");
          loadExistingData();
      } catch (error) { 
          console.error(error); // Para ver el error real en consola
          toast.error("Error guardando: Revisa los datos ingresados."); 
      } 
      finally { setSaving(false); }
  };

  // Helper para limpiar strings vacíos y convertirlos a null
  const cleanPayload = (data) => {
      const cleaned = { ...data };
      ['temp_max', 'temp_min', 'humidity', 'wind_speed', 'solar_rad'].forEach(field => {
          if (cleaned[field] === '' || cleaned[field] === undefined) {
              cleaned[field] = null;
          }
      });
      return cleaned;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-agri-dark">
                <CloudSun className="text-orange-500" size={32}/> Clima & ETo
            </h1>
            <p className="text-sm text-gray-500">Gestión híbrida: Satelital o Manual.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
            <Calendar size={18} className="text-gray-400"/>
            <input 
                type="date" 
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)} 
                className="font-bold text-gray-700 outline-none cursor-pointer"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PANEL IZQUIERDO */}
        <div className="space-y-6">
            
            {/* Coordenadas */}
            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                <h4 className="font-bold text-gray-700 flex items-center gap-2 text-sm"><MapPin size={16}/> Punto de Cálculo</h4>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase">Latitud</label>
                        <input 
                            type="number" step="0.0001"
                            value={weatherData.latitude}
                            onChange={(e) => setWeatherData({...weatherData, latitude: parseFloat(e.target.value)})}
                            className="w-full border p-2 rounded text-xs font-mono focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase">Longitud</label>
                        <input 
                            type="number" step="0.0001"
                            value={weatherData.longitude}
                            onChange={(e) => setWeatherData({...weatherData, longitude: parseFloat(e.target.value)})}
                            className="w-full border p-2 rounded text-xs font-mono focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* 🟢 Selector de Fórmula (DINÁMICO DESDE BACKEND) */}
            <div className="bg-white p-4 rounded-xl border shadow-sm">
                <label className="text-xs font-bold text-gray-700 uppercase block mb-2 flex items-center gap-2">
                    <Calculator size={14}/> Fórmula Matemática
                </label>
                
                {availableMethods.length > 0 ? (
                    <select 
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 mb-2"
                        value={weatherData.method_used}
                        onChange={(e) => setWeatherData({...weatherData, method_used: e.target.value})}
                    >
                        {availableMethods.map((method) => (
                            <option key={method.value} value={method.value}>{method.label}</option>
                        ))}
                    </select>
                ) : (
                    <div className="text-xs text-gray-400 animate-pulse">Cargando fórmulas...</div>
                )}
                
                <p className="text-[10px] text-gray-400">
                   * Esta selección aplica para cálculo Auto y Manual.
                </p>
            </div>

            {/* Selector de Modo */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
                <button onClick={()=>setMode('SATELLITE')} className={`flex-1 py-3 rounded-lg font-bold text-xs flex justify-center items-center gap-2 transition-all ${mode==='SATELLITE'?'bg-white shadow text-blue-600':'text-gray-500'}`}>🛰️ Auto (NASA)</button>
                <button onClick={()=>setMode('MANUAL')} className={`flex-1 py-3 rounded-lg font-bold text-xs flex justify-center items-center gap-2 transition-all ${mode==='MANUAL'?'bg-white shadow text-green-600':'text-gray-500'}`}>📝 Manual</button>
            </div>

            {/* Acciones */}
            {mode === 'SATELLITE' ? (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    {isRecentDate() && (
                        <div className="mb-3 bg-yellow-100 border-l-2 border-yellow-400 p-2 rounded flex gap-2">
                            <AlertTriangle size={14} className="text-yellow-600 shrink-0 mt-0.5"/>
                            <p className="text-[10px] text-yellow-800 leading-tight">
                                <strong>Datos no disponibles:</strong> NASA POWER tiene un retraso de ~{NASA_LAG_DAYS} días.
                            </p>
                        </div>
                    )}
                    <button onClick={handleSatelliteSync} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-2 rounded shadow hover:bg-blue-700 flex justify-center items-center gap-2 text-sm">
                        {loading ? <RefreshCw className="animate-spin" size={16}/> : <RefreshCw size={16}/>} Sincronizar NASA
                    </button>
                </div>
            ) : (
                <button onClick={handleManualCalculate} disabled={calculating} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow hover:bg-green-700 flex justify-center items-center gap-2 text-sm">
                    {calculating ? <RefreshCw className="animate-spin" size={16}/> : <Calculator size={16}/>} Calcular Ahora
                </button>
            )}
        </div>

        {/* PANEL DERECHO: FORMULARIO */}
        <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-lg border border-gray-100 relative">
            
            {loading && (<div className="absolute inset-0 bg-white/90 z-10 flex flex-col justify-center items-center"><RefreshCw size={40} className="animate-spin text-blue-500 mb-2"/><span className="text-sm font-bold text-gray-500">Consultando NASA...</span></div>)}

            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-700 text-lg">Variables Climáticas</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${mode==='SATELLITE'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>
                    {mode === 'SATELLITE' ? 'Automático' : 'Manual'}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase flex gap-1"><Thermometer size={14} className="text-red-500"/> T. Máxima (°C)</label>
                    <input type="number" step="0.1" disabled={mode === 'SATELLITE'} value={weatherData.temp_max} onChange={e => setWeatherData({...weatherData, temp_max: e.target.value})} className="w-full border p-3 rounded-lg font-mono text-lg outline-none focus:border-agri-green disabled:bg-gray-50"/>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase flex gap-1"><Thermometer size={14} className="text-blue-500"/> T. Mínima (°C)</label>
                    <input type="number" step="0.1" disabled={mode === 'SATELLITE'} value={weatherData.temp_min} onChange={e => setWeatherData({...weatherData, temp_min: e.target.value})} className="w-full border p-3 rounded-lg font-mono text-lg outline-none focus:border-agri-green disabled:bg-gray-50"/>
                </div>

                {shouldShow('humidity') && (
                     <div className="space-y-1 animate-in fade-in">
                        <label className="text-xs font-bold text-gray-500 uppercase flex gap-1"><Droplets size={14} className="text-cyan-500"/> Humedad (%)</label>
                        <input type="number" disabled={mode==='SATELLITE'} value={weatherData.humidity} onChange={e=>setWeatherData({...weatherData, humidity: e.target.value})} className="w-full border p-3 rounded-lg font-mono disabled:bg-gray-50"/>
                     </div>
                )}
                
                 {shouldShow('wind') && (
                     <div className="space-y-1 animate-in fade-in">
                        <label className="text-xs font-bold text-gray-500 uppercase flex gap-1"><Wind size={14} className="text-gray-500"/> Viento (m/s)</label>
                        <input type="number" step="0.1" disabled={mode==='SATELLITE'} value={weatherData.wind_speed} onChange={e=>setWeatherData({...weatherData, wind_speed: e.target.value})} className="w-full border p-3 rounded-lg font-mono disabled:bg-gray-50"/>
                     </div>
                )}
                 
                 {shouldShow('solar') && (
                     <div className="md:col-span-2 space-y-1 animate-in fade-in">
                        <label className="text-xs font-bold text-gray-500 uppercase flex gap-1"><Sun size={14} className="text-orange-500"/> Radiación (MJ/m²)</label>
                        <input type="number" step="0.01" disabled={mode==='SATELLITE'} value={weatherData.solar_rad} onChange={e=>setWeatherData({...weatherData, solar_rad: e.target.value})} className="w-full border p-3 rounded-lg font-mono disabled:bg-gray-50"/>
                     </div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center bg-gray-50 p-6 rounded-xl">
                <div className="flex items-center gap-4">
                    <div className="bg-gray-200 p-3 rounded-full text-gray-600"><Calculator size={28}/></div>
                    <div>
                        <span className="text-xs font-bold text-gray-500 uppercase block">ETo Resultante</span>
                        <span className="text-xs text-blue-600 font-bold">{weatherData.method_used}</span>
                    </div>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-gray-800">{weatherData.eto_mm || '--'}</span>
                    <span className="text-sm font-bold text-gray-500">mm/día</span>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button onClick={handleSave} disabled={saving || !weatherData.eto_mm} className="bg-gray-900 text-white px-8 py-3 rounded-lg font-bold shadow hover:bg-black disabled:opacity-50 flex items-center gap-2">
                    <Save size={18}/> Guardar
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}