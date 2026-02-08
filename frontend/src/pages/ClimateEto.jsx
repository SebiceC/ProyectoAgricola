import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { 
  CloudSun, Thermometer, Droplets, Calendar, 
  Save, RefreshCw, Wind, Sun, Calculator,
  MapPin, History, Edit, Trash2, 
  BarChart, FileText, BookOpen, Eye, 
  FileSpreadsheet, Image as ImageIcon,
  CheckSquare, Square, ChevronLeft, ChevronRight, Search,
  List, X, Database, ArrowRight // 🟢 Iconos actualizados
} from 'lucide-react';
import { inputToApiFormat } from '../utils/dateUtils';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

export default function ClimateEto() {
  // ==========================================
  // 1. ESTADOS GLOBALES Y CONFIGURACIÓN
  // ==========================================
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('DAILY'); 
  const [availableMethods, setAvailableMethods] = useState([]);
  const [userPreferredMethod, setUserPreferredMethod] = useState('PENMAN');

  // ==========================================
  // 2. ESTADOS DE LA TABLA AVANZADA (DATAGRID)
  // ==========================================
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); 
  const [isCustomPaging, setIsCustomPaging] = useState(false);
  
  const [filterSource, setFilterSource] = useState('ALL'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // ==========================================
  // 3. ESTADOS OPERATIVOS
  // ==========================================
  const [mode, setMode] = useState('SATELLITE'); 
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const NASA_LAG_DAYS = 4; 
  
  const [weatherData, setWeatherData] = useState({
    id: null,
    method_used: 'PENMAN', 
    temp_max: '', temp_min: '', humidity: '', wind_speed: '', solar_rad: '', eto_mm: '',
    latitude: 2.92, 
    longitude: -75.28,
    source: 'SATELLITE'
  });

  // Estados para Análisis Histórico
  const [analysisParams, setAnalysisParams] = useState({
      start_date: '2015-01-01',
      end_date: '2025-01-01', 
  });
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedFormulas, setSelectedFormulas] = useState(['PENMAN', 'HARGREAVES']); 
  const [analyzing, setAnalyzing] = useState(false);
  
  // Estados para Biblioteca
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [studyName, setStudyName] = useState('');
  const [savedStudies, setSavedStudies] = useState([]);
  const chartRef = useRef(null);

  const CHART_COLORS = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#db2777', '#0891b2', '#be123c', '#854d0e', '#1e293b'];
  const FIELD_MAPPING = { 'PENMAN': ['temp', 'humidity', 'wind', 'solar'], 'HARGREAVES': ['temp'], 'TURC': ['temp', 'humidity', 'solar'], 'MAKKINK': ['temp', 'solar'], 'CHRISTIANSEN': ['temp', 'humidity', 'wind', 'solar'], 'IVANOV': ['temp', 'humidity'], 'SIMPLE_ABSTEW': ['temp', 'solar'] };

  // ==========================================
  // 4. CARGA INICIAL
  // ==========================================
  useEffect(() => {
    const loadInitData = async () => {
        try {
            const [choicesRes, settingsRes, historyRes] = await Promise.all([
                api.get('/settings/choices/'),
                api.get('/settings/'),
                api.get('/weather/') 
            ]);
            setAvailableMethods(choicesRes.data.eto_methods);
            setHistory(historyRes.data); 
            
            if (settingsRes.data && settingsRes.data.length > 0) {
                const pref = settingsRes.data[0].preferred_eto_method;
                setUserPreferredMethod(pref);
                setWeatherData(prev => ({ ...prev, method_used: pref }));
            }
        } catch (error) { console.error("Error init data", error); }
    };
    loadInitData();
  }, []);

  useEffect(() => { if (activeTab === 'LIBRARY') loadSavedStudies(); }, [activeTab]);
  useEffect(() => { if(activeTab === 'DAILY') loadExistingData(); }, [selectedDate, activeTab]);

  const loadHistory = async () => { try { const res = await api.get('/weather/'); setHistory(res.data); } catch (error) {} };
  const loadSavedStudies = async () => { try { const res = await api.get('/studies/'); setSavedStudies(res.data); } catch (error) {} };

  // ==========================================
  // 5. LÓGICA TABLA AVANZADA
  // ==========================================
  const getFilteredHistory = () => {
      return history.filter(item => {
          if (filterSource !== 'ALL') {
              const isNasa = item.source && item.source.includes('NASA');
              if (filterSource === 'NASA' && !isNasa) return false;
              if (filterSource === 'MANUAL' && isNasa) return false;
          }
          if (searchTerm && !item.date.includes(searchTerm)) return false;
          return true;
      });
  };

  const filteredItems = getFilteredHistory();
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageSizeChange = (e) => {
      const val = e.target.value;
      if (val === 'CUSTOM') { setIsCustomPaging(true); } 
      else { setItemsPerPage(Number(val)); setCurrentPage(1); }
  };

  const handleCustomPageInput = (e) => {
      const val = Number(e.target.value);
      if (val > 0) { setItemsPerPage(val); setCurrentPage(1); }
  };

  const toggleSelectAll = () => {
      if (selectedIds.length === currentItems.length) setSelectedIds([]);
      else setSelectedIds(currentItems.map(i => i.id));
  };

  const toggleSelectRow = (id) => {
      if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id));
      else setSelectedIds([...selectedIds, id]);
  };

  const handleBulkDelete = async () => {
      if (!window.confirm(`¿Estás seguro de eliminar ${selectedIds.length} registros?`)) return;
      const toastId = toast.loading("Eliminando registros...");
      try {
          await Promise.all(selectedIds.map(id => api.delete(`/weather/${id}/`)));
          toast.success("Registros eliminados", { id: toastId });
          setSelectedIds([]);
          loadHistory();
      } catch (error) { toast.error("Error eliminando", { id: toastId }); }
  };

  // ==========================================
  // 6. LÓGICA OPERATIVA DIARIA
  // ==========================================
  const loadExistingData = async () => {
    setLoading(true);
    try {
        const res = await api.get(`/weather/fetch_for_date/`, {
            params: { date: inputToApiFormat(selectedDate), lat: weatherData.latitude, lon: weatherData.longitude }
        });

        if (res.data.id || res.data.temp_max) {
            const methodToApply = res.data.method_used || userPreferredMethod;
            const newData = {
                ...weatherData, ...res.data,
                humidity: res.data.humidity_mean ?? res.data.humidity ?? '', 
                temp_max: res.data.temp_max ?? '', temp_min: res.data.temp_min ?? '',
                wind_speed: res.data.wind_speed ?? '', solar_rad: res.data.solar_rad ?? '',
                eto_mm: res.data.eto_mm ?? '', method_used: methodToApply
            };
            setWeatherData(newData);
            const isNasa = res.data.source && res.data.source.includes('NASA');
            setMode(isNasa ? 'SATELLITE' : 'MANUAL');

            if ((!res.data.eto_mm || res.data.eto_mm === 0) && res.data.temp_max) {
                setTimeout(() => handleAutoCalculate(newData, methodToApply), 100);
            }
        } else { resetValues(); }
    } catch (e) { resetValues(); } finally { setLoading(false); }
  };

  const handleAutoCalculate = async (dataToCalc, method) => {
      try {
          const payload = cleanPayload({ ...dataToCalc, method: method });
          const res = await api.post('/weather/preview/', payload);
          setWeatherData(prev => ({ ...prev, eto_mm: res.data.eto }));
      } catch (error) { console.error("Error auto-calc", error); }
  };

  const resetValues = () => { setWeatherData(prev => ({ ...prev, id: null, eto_mm: '', source: 'SATELLITE', temp_max: '', temp_min: '', humidity: '', wind_speed: '', solar_rad: '' })); };
  const cleanPayload = (data) => { const c = { ...data }; ['temp_max', 'temp_min', 'humidity', 'wind_speed', 'solar_rad'].forEach(f => { if(c[f]==='') c[f]=null; }); return c; };
  const isRecentDate = () => { const today = new Date(); const sel = new Date(selectedDate); return Math.ceil(Math.abs(today-sel)/(1000*60*60*24)) < NASA_LAG_DAYS; };
  const shouldShow = (f) => (FIELD_MAPPING[weatherData.method_used]||FIELD_MAPPING['PENMAN']).includes(f);
  
  const handleSatelliteSync = async () => {
    setLoading(true);
    try {
        const res = await api.post(`/weather/sync_nasa/`, { date: inputToApiFormat(selectedDate), lat: weatherData.latitude, lon: weatherData.longitude, method: weatherData.method_used });
        setWeatherData(prev => ({ ...prev, ...res.data, humidity: res.data.humidity_mean ?? res.data.humidity ?? '', source: 'SATELLITE' }));
        toast.success(`Datos NASA obtenidos. ETo: ${res.data.eto_mm} mm`);
    } catch (error) { toast.error("Error NASA POWER."); } finally { setLoading(false); }
  };

  const handleManualCalculate = async () => {
      setCalculating(true);
      try {
          const res = await api.post('/weather/preview/', cleanPayload({...weatherData, method: weatherData.method_used, date: inputToApiFormat(selectedDate)}));
          setWeatherData(prev => ({ ...prev, eto_mm: res.data.eto }));
          toast.success(`Cálculo: ${res.data.eto} mm`);
      } catch (error) { toast.error("Error cálculo manual."); } finally { setCalculating(false); }
  };

  const handleSave = async () => {
      if (!weatherData.eto_mm) return toast.error("Sin ETo");
      setSaving(true);
      try {
          const payload = cleanPayload({ ...weatherData, source: mode, date: inputToApiFormat(selectedDate) });
          if (weatherData.id) await api.patch(`/weather/${weatherData.id}/`, payload);
          else await api.post(`/weather/`, payload);
          toast.success("Guardado");
          loadExistingData(); loadHistory(); 
      } catch (error) { toast.error("Error guardando"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("¿Eliminar registro?")) return;
      try { await api.delete(`/weather/${id}/`); toast.success("Eliminado"); if (weatherData.id === id) resetValues(); loadHistory(); } catch (e) { toast.error("Error eliminando"); }
  };

  // ==========================================
  // 7. ANÁLISIS HISTÓRICO Y SINCRONIZACIÓN
  // ==========================================
  
  // A. Solo Visualizar Gráfica (NO GUARDA)
  const handleAnalyzeHistory = async () => { 
      setAnalyzing(true); 
      try { 
          const res = await api.get('/weather/historical_analysis/', { 
              params: { lat: weatherData.latitude, lon: weatherData.longitude, start_date: analysisParams.start_date, end_date: analysisParams.end_date } 
          }); 
          const chartData = res.data.map(item => ({ name: item.month_name, ...item.eto_results })); 
          setHistoricalData(chartData); 
          toast.success("Análisis completado."); 
      } catch (error) { toast.error("Error analizando"); } 
      finally { setAnalyzing(false); } 
  };

  // 🟢 B. Nueva Función: Sincronizar (COMMIT)
  const handleCommitHistory = async () => {
      // 1. Confirmación de Seguridad
      if (!window.confirm("¿Estás seguro de sincronizar los datos históricos?\n\nEsto guardará los registros del último año en tu tabla de 'Operación Diaria' para que puedas usarlos en el riego. Los datos manuales NO serán sobreescritos.")) return;
      
      const toastId = toast.loading("Sincronizando base de datos...");
      try {
          // 2. Llamada al Backend (Endpoint que creamos antes)
          const res = await api.post('/weather/commit_history/', {
              lat: weatherData.latitude,
              lon: weatherData.longitude
          });
          
          // 3. Éxito
          toast.success(`Sincronización completada: ${res.data.details.synced} días guardados.`, { id: toastId });
          
          // 4. Recargar la tabla para ver los cambios
          await loadHistory();
          
      } catch (error) {
          console.error(error);
          toast.error("Error al sincronizar datos.", { id: toastId });
      }
  };

  const handleExportExcel = () => { if (historicalData.length === 0) return toast.error("Sin datos"); const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(historicalData.map(({month, name, ...rest}) => ({Mes: name, ...rest}))); XLSX.utils.book_append_sheet(wb, ws, "Datos ETo"); XLSX.writeFile(wb, `ETo_${analysisParams.start_date}.xlsx`); };
  const handleExportImage = async () => { if (!chartRef.current) return; try { const canvas = await html2canvas(chartRef.current, { backgroundColor: '#fff', scale: 2 }); const link = document.createElement('a'); link.href = canvas.toDataURL("image/png"); link.download = `Grafica_${analysisParams.start_date}.png`; link.click(); } catch (e) {} };
  
  const handleSaveStudy = async () => { if (!studyName.trim()) return toast.error("Falta nombre"); try { await api.post('/studies/', { name: studyName, start_date: analysisParams.start_date, end_date: analysisParams.end_date, latitude: weatherData.latitude, longitude: weatherData.longitude, result_data: historicalData }); toast.success("Estudio guardado"); setShowSaveModal(false); setStudyName(''); } catch (e) { toast.error("Error guardando estudio"); } };
  const handleLoadStudy = (s) => { setAnalysisParams({ start_date: s.start_date, end_date: s.end_date }); setWeatherData(prev=>({...prev, latitude: s.latitude, longitude: s.longitude})); setHistoricalData(s.result_data); setActiveTab('HISTORICAL'); toast.success("Cargado"); };
  const handleDeleteStudy = async (id) => { if(!confirm("¿Eliminar?")) return; try { await api.delete(`/studies/${id}/`); toast.success("Eliminado"); loadSavedStudies(); } catch (e) {} };
  const toggleFormula = (m) => setSelectedFormulas(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div><h1 className="text-2xl font-bold flex items-center gap-2 text-agri-dark"><CloudSun className="text-orange-500" size={32}/> Clima & ETo</h1><p className="text-sm text-gray-500">Gestión Inteligente del Agua</p></div>
      </div>

      {/* TABS */}
      <div className="flex border-b mb-8">
            {['DAILY', 'HISTORICAL', 'LIBRARY'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab ? 'border-green-600 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                   {tab==='DAILY' && <Calendar size={16}/>} {tab==='HISTORICAL' && <BarChart size={16}/>} {tab==='LIBRARY' && <BookOpen size={16}/>}
                   {tab==='DAILY'?'Operación Diaria':tab==='HISTORICAL'?'Análisis Histórico':'Biblioteca'}
                </button>
            ))}
      </div>

      {/* VISTA 1: OPERACIÓN DIARIA */}
      {activeTab === 'DAILY' && (
      <div className="animate-in fade-in duration-300">
        <div className="flex justify-end mb-4"><div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm"><span className="text-xs font-bold text-gray-500 uppercase">Fecha Operativa:</span><input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="font-bold text-gray-700 outline-none cursor-pointer text-sm"/></div></div>

        {/* INPUTS PRINCIPALES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                    <h4 className="font-bold text-gray-700 flex items-center gap-2 text-sm"><MapPin size={16}/> Punto de Cálculo</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="number" step="0.0001" value={weatherData.latitude} onChange={(e) => setWeatherData({...weatherData, latitude: parseFloat(e.target.value)})} className="w-full border p-2 rounded text-xs font-mono"/>
                        <input type="number" step="0.0001" value={weatherData.longitude} onChange={(e) => setWeatherData({...weatherData, longitude: parseFloat(e.target.value)})} className="w-full border p-2 rounded text-xs font-mono"/>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm"><label className="text-xs font-bold text-gray-700 uppercase block mb-2 flex items-center gap-2"><Calculator size={14}/> Fórmula Matemática</label><select className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 mb-2" value={weatherData.method_used} onChange={(e) => setWeatherData({...weatherData, method_used: e.target.value})}>{availableMethods.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}</select></div>
                <div className="flex bg-gray-100 p-1 rounded-xl"><button onClick={()=>setMode('SATELLITE')} className={`flex-1 py-3 rounded-lg font-bold text-xs flex gap-2 justify-center items-center ${mode==='SATELLITE'?'bg-white shadow text-blue-600':'text-gray-500'}`}>🛰️ Auto (NASA)</button><button onClick={()=>setMode('MANUAL')} className={`flex-1 py-3 rounded-lg font-bold text-xs flex gap-2 justify-center items-center ${mode==='MANUAL'?'bg-white shadow text-green-600':'text-gray-500'}`}>📝 Manual</button></div>
                {mode === 'SATELLITE' ? (<div className="bg-blue-50 p-4 rounded-xl border border-blue-100">{isRecentDate() && <div className="mb-3 bg-yellow-100 border-l-2 border-yellow-400 p-2 rounded text-[10px] text-yellow-800">⚠️ NASA tiene retraso de ~{NASA_LAG_DAYS} días.</div>}<button onClick={handleSatelliteSync} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-2 rounded shadow hover:bg-blue-700 flex justify-center items-center gap-2 text-sm">{loading ? <RefreshCw className="animate-spin" size={16}/> : <RefreshCw size={16}/>} Sincronizar NASA</button></div>) : (<button onClick={handleManualCalculate} disabled={calculating} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow hover:bg-green-700 flex justify-center items-center gap-2 text-sm">{calculating ? <RefreshCw className="animate-spin" size={16}/> : <Calculator size={16}/>} Calcular Ahora</button>)}
            </div>
            <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-lg border border-gray-100 relative">
                {loading && (<div className="absolute inset-0 bg-white/90 z-10 flex flex-col justify-center items-center"><RefreshCw size={40} className="animate-spin text-blue-500 mb-2"/><span className="text-sm font-bold text-gray-500">Consultando NASA...</span></div>)}
                <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-gray-700 text-lg">Variables Climáticas</h3><span className={`text-xs px-2 py-1 rounded-full font-bold ${mode==='SATELLITE'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>{mode === 'SATELLITE' ? 'Automático' : 'Manual'}</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase flex gap-1"><Thermometer size={14} className="text-red-500"/> T. Máxima (°C)</label><input type="number" step="0.1" disabled={mode === 'SATELLITE'} value={weatherData.temp_max} onChange={e => setWeatherData({...weatherData, temp_max: e.target.value})} className="w-full border p-3 rounded-lg font-mono text-lg outline-none"/></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase flex gap-1"><Thermometer size={14} className="text-blue-500"/> T. Mínima (°C)</label><input type="number" step="0.1" disabled={mode === 'SATELLITE'} value={weatherData.temp_min} onChange={e => setWeatherData({...weatherData, temp_min: e.target.value})} className="w-full border p-3 rounded-lg font-mono text-lg outline-none"/></div>
                    {shouldShow('humidity') && <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase flex gap-1"><Droplets size={14} className="text-cyan-500"/> Humedad (%)</label><input type="number" disabled={mode==='SATELLITE'} value={weatherData.humidity} onChange={e=>setWeatherData({...weatherData, humidity: e.target.value})} className="w-full border p-3 rounded-lg font-mono"/></div>}
                    {shouldShow('wind') && <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase flex gap-1"><Wind size={14} className="text-gray-500"/> Viento (m/s)</label><input type="number" step="0.1" disabled={mode==='SATELLITE'} value={weatherData.wind_speed} onChange={e=>setWeatherData({...weatherData, wind_speed: e.target.value})} className="w-full border p-3 rounded-lg font-mono"/></div>}
                    {shouldShow('solar') && <div className="md:col-span-2 space-y-1"><label className="text-xs font-bold text-gray-500 uppercase flex gap-1"><Sun size={14} className="text-orange-500"/> Radiación (MJ/m²)</label><input type="number" step="0.01" disabled={mode==='SATELLITE'} value={weatherData.solar_rad} onChange={e=>setWeatherData({...weatherData, solar_rad: e.target.value})} className="w-full border p-3 rounded-lg font-mono"/></div>}
                </div>
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center bg-gray-50 p-6 rounded-xl"><div className="flex items-center gap-4"><div className="bg-gray-200 p-3 rounded-full text-gray-600"><Calculator size={28}/></div><div><span className="text-xs font-bold text-gray-500 uppercase block">ETo Resultante</span><span className="text-xs text-blue-600 font-bold">{weatherData.method_used}</span></div></div><div className="flex items-baseline gap-1"><span className="text-4xl font-black text-gray-800">{weatherData.eto_mm || '--'}</span><span className="text-sm font-bold text-gray-500">mm/día</span></div></div>
                <div className="mt-6 flex justify-end"><button onClick={handleSave} disabled={saving || !weatherData.eto_mm} className="bg-gray-900 text-white px-8 py-3 rounded-lg font-bold shadow hover:bg-black disabled:opacity-50 flex items-center gap-2"><Save size={18}/> Guardar Registro</button></div>
            </div>
        </div>

        {/* 🟢 TABLA AVANZADA CON FÓRMULA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col xl:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 w-full xl:w-auto">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2"><History size={20}/> Historial</h3>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">{filteredItems.length} registros</span>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full xl:w-auto items-center">
                    {/* Buscador */}
                    <div className="relative flex-1 min-w-[150px]">
                        <Search size={14} className="absolute left-3 top-2.5 text-gray-400"/>
                        <input type="text" placeholder="Buscar fecha..." className="pl-8 pr-3 py-2 text-xs border rounded-lg w-full focus:ring-2 focus:ring-blue-100 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    
                    {/* Filtro Fuente */}
                    <select className="text-xs border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 bg-white" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
                        <option value="ALL">Todas las fuentes</option>
                        <option value="NASA">🛰️ NASA / Satélite</option>
                        <option value="MANUAL">📝 Manual</option>
                    </select>

                    {/* PAGINACIÓN PERSONALIZADA */}
                    <div className="flex items-center gap-1">
                        <List size={16} className="text-gray-400"/>
                        {isCustomPaging ? (
                            <div className="flex items-center bg-white border rounded-lg overflow-hidden w-32 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <input type="number" min="1" autoFocus placeholder="#" className="w-full px-2 py-1.5 text-xs outline-none text-center" onChange={handleCustomPageInput} value={itemsPerPage}/>
                                <button onClick={() => { setIsCustomPaging(false); setItemsPerPage(10); }} className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 border-l text-gray-500"><X size={12}/></button>
                            </div>
                        ) : (
                            <select className="text-xs border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 bg-white cursor-pointer hover:bg-gray-50" value={itemsPerPage} onChange={handlePageSizeChange}>
                                <option value={10}>10 por pág</option>
                                <option value={25}>25 por pág</option>
                                <option value={50}>50 por pág</option>
                                <option value={100}>100 por pág</option>
                                <option value="CUSTOM" className="font-bold text-blue-600">✏️ Personalizado...</option>
                            </select>
                        )}
                    </div>

                    {/* Borrado Masivo */}
                    {selectedIds.length > 0 && (
                        <button onClick={handleBulkDelete} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-red-100 transition-colors animate-in fade-in">
                            <Trash2 size={14}/> Borrar ({selectedIds.length})
                        </button>
                    )}
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 w-10"><button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">{selectedIds.length === currentItems.length && currentItems.length > 0 ? <CheckSquare size={16}/> : <Square size={16}/>}</button></th>
                            <th className="px-4 py-3">Fecha</th>
                            <th className="px-4 py-3">Fuente</th>
                            <th className="px-4 py-3">Fórmula</th>
                            <th className="px-4 py-3 text-center">T. Max/Min</th>
                            <th className="px-4 py-3 text-center">ETo (mm)</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentItems.length === 0 ? (
                            <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-400">No hay registros que coincidan.</td></tr>
                        ) : (
                            currentItems.map((item) => (
                                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-50' : ''}`}>
                                    <td className="px-4 py-3"><button onClick={() => toggleSelectRow(item.id)} className={`${selectedIds.includes(item.id) ? 'text-blue-600' : 'text-gray-300'}`}>{selectedIds.includes(item.id) ? <CheckSquare size={16}/> : <Square size={16}/>}</button></td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{item.date}</td>
                                    
                                    <td className="px-4 py-3">
                                        {item.source && item.source.includes('NASA') ? (<span className="px-2 py-1 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-600 border-blue-100 flex items-center gap-1 w-fit">🛰️ {item.source.includes('HISTORIC')?'NASA (Hist.)':'NASA (Live)'}</span>) : (<span className="px-2 py-1 rounded-full text-[10px] font-bold border bg-green-50 text-green-600 border-green-100 flex items-center gap-1 w-fit">📝 Manual</span>)}
                                    </td>
                                    
                                    {/* 🟢 CELDA DE FÓRMULA */}
                                    <td className="px-4 py-3">
                                        <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200" title={item.method}>
                                            {availableMethods.find(m => m.value === item.method)?.label || item.method || 'Auto'}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 text-center"><span className="text-red-500 font-bold">{item.temp_max}°</span> / <span className="text-blue-500 font-bold">{item.temp_min}°</span></td>
                                    
                                    <td className="px-4 py-3 text-center">
                                        {item.eto_mm > 0 ? (
                                            <span className="bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded">{item.eto_mm}</span>
                                        ) : (
                                            <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded border">⏳ Pendiente</span>
                                        )}
                                    </td>
                                    
                                    <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-2"><button onClick={() => {setSelectedDate(item.date); window.scrollTo({top:0, behavior:'smooth'});}} className="text-blue-500 hover:bg-blue-50 p-1 rounded" title="Ver/Recalcular"><Edit size={16}/></button><button onClick={() => handleDelete(item.id)} className="text-red-400 hover:bg-red-50 p-1 rounded" title="Eliminar"><Trash2 size={16}/></button></div></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (<div className="p-4 border-t border-gray-100 flex justify-center items-center gap-4 bg-gray-50"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-white border disabled:opacity-50"><ChevronLeft size={16}/></button><span className="text-xs font-bold text-gray-600">Página {currentPage} de {totalPages}</span><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-white border disabled:opacity-50"><ChevronRight size={16}/></button></div>)}
        </div>
      </div>
      )}
      
      {/* VISTA 2: ANÁLISIS HISTÓRICO (Con el nuevo botón) */}
      {activeTab === 'HISTORICAL' && (
          <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2 border-b pb-2"><Calendar size={20} className="text-blue-500"/> Configuración del Análisis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                      <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Desde</label><input type="date" value={analysisParams.start_date} onChange={e=>setAnalysisParams({...analysisParams, start_date: e.target.value})} className="w-full border p-2 rounded text-sm"/></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Hasta</label><input type="date" value={analysisParams.end_date} onChange={e=>setAnalysisParams({...analysisParams, end_date: e.target.value})} className="w-full border p-2 rounded text-sm"/></div>
                      <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Comparar Fórmulas</label><div className="flex flex-wrap gap-2">{availableMethods.map(m => (<button key={m.value} onClick={() => toggleFormula(m.value)} className={`text-xs px-3 py-1.5 rounded-full border ${selectedFormulas.includes(m.value) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white text-gray-600'}`}>{m.label}</button>))}</div></div>
                  </div>
                  <div className="mt-6 flex justify-end border-t pt-4"><button onClick={handleAnalyzeHistory} disabled={analyzing} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold shadow hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">{analyzing ? <RefreshCw className="animate-spin" size={18}/> : <BarChart size={18}/>} Generar Gráfica Climatológica</button></div>
              </div>
              {historicalData.length > 0 && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                       <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
                            <div><h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><FileText size={20} className="text-blue-500"/> Resultados</h3><p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Promedio Anual</p></div>
                            
                            {/* 🟢 BOTONERA DE ACCIONES */}
                            <div className="flex gap-2 flex-wrap justify-end">
                                {/* Botón Sincronizar (Base de Datos) */}
                                <button 
                                    onClick={handleCommitHistory} 
                                    className="bg-orange-50 text-orange-700 border border-orange-200 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-orange-100 flex items-center gap-2 transition-transform hover:scale-105"
                                    title="Guardar datos en la tabla diaria"
                                >
                                    <Database size={16}/> Sincronizar a Diario
                                </button>

                                <div className="w-px bg-gray-300 mx-1 h-8 hidden md:block"></div>
                                
                                {/* Botones de Exportación (Archivos) */}
                                <button onClick={handleExportExcel} className="bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-green-100">
                                    <FileSpreadsheet size={16}/> Excel
                                </button>
                                <button onClick={handleExportImage} className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-purple-100">
                                    <ImageIcon size={16}/> Imagen
                                </button>
                                
                                <div className="w-px bg-gray-300 mx-1 h-8 hidden md:block"></div>
                                
                                {/* Botón Guardar Estudio (Biblioteca) */}
                                <button onClick={() => setShowSaveModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow hover:bg-blue-700 flex items-center gap-2">
                                    <Save size={16}/> Guardar Estudio
                                </button>
                            </div>
                      </div>
                      <div ref={chartRef} className="p-4 bg-white rounded-lg"><h4 className="text-center font-bold text-gray-600 mb-4">Evapotranspiración Mensual (mm/día)</h4><div className="h-96 w-full mb-6"><ResponsiveContainer width="100%" height="100%"><LineChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/><XAxis dataKey="name" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} dy={10} /><YAxis label={{ value: 'ETo (mm/día)', angle: -90, position: 'insideLeft', style: {textAnchor: 'middle', fill: '#9ca3af', fontSize: 12} }} tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false}/><RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} cursor={{stroke: '#e5e7eb', strokeWidth: 2}}/><Legend wrapperStyle={{paddingTop: '20px'}}/>{selectedFormulas.map((f, i) => (<Line key={f} type="monotone" dataKey={f} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 7, strokeWidth: 0}} animationDuration={1500}/>))}</LineChart></ResponsiveContainer></div></div>
                  </div>
              )}
              {showSaveModal && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"><h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2"><Save size={20} className="text-green-600"/> Guardar Análisis</h3><div className="mb-6"><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Nombre</label><input autoFocus type="text" value={studyName} onChange={e => setStudyName(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg outline-none"/></div><div className="flex justify-end gap-3"><button onClick={() => setShowSaveModal(false)} className="text-gray-600 font-bold text-sm px-4 py-2 hover:bg-gray-100 rounded-lg">Cancelar</button><button onClick={handleSaveStudy} disabled={!studyName.trim()} className="bg-green-600 text-white font-bold text-sm px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">Guardar</button></div></div></div>)}
          </div>
      )}

      {activeTab === 'LIBRARY' && (
        <div className="animate-in fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50"><div><h3 className="font-bold text-gray-800 text-lg">Mis Estudios</h3><p className="text-xs text-gray-500">Historial guardado.</p></div><span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">{savedStudies.length} Estudios</span></div>
                {savedStudies.length === 0 ? (<div className="p-12 text-center text-gray-400"><BookOpen size={48} className="mx-auto mb-4 opacity-20"/><p>Sin estudios guardados.</p><button onClick={()=>setActiveTab('HISTORICAL')} className="mt-4 text-blue-600 text-sm font-bold hover:underline">Crear nuevo</button></div>) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">{savedStudies.map((s) => (<div key={s.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white flex flex-col"><div className="flex justify-between items-start mb-2"><h4 className="font-bold text-gray-800 line-clamp-1">{s.name}</h4><span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border">{s.created_at?.split('T')[0]}</span></div><div className="text-xs text-gray-500 space-y-1 mb-4 flex-1"><p className="flex items-center gap-1"><MapPin size={10}/> {s.latitude}, {s.longitude}</p><p className="flex items-center gap-1"><Calendar size={10}/> {s.start_date} / {s.end_date}</p></div><div className="flex gap-2 mt-auto"><button onClick={() => handleLoadStudy(s)} className="flex-1 bg-purple-50 text-purple-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-purple-100"><Eye size={14}/> Ver</button><button onClick={() => handleDeleteStudy(s.id)} className="px-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={14}/></button></div></div>))}</div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}