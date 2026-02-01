import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { 
  CloudRain, Satellite, Plus, Trash2, Calendar, 
  RefreshCw, Droplets, MapPin, AlertTriangle, Info, X, Search 
} from 'lucide-react';

// Importamos solo toStandardDate para VISUALIZAR, ya no convertimos para ENVIAR
import { toStandardDate } from '../utils/dateUtils';

export default function PrecipitationManager() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Estado para Lluvia Manual
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ date: '', mm: '' });

  // Estado para Nueva Estación
  const [showStationForm, setShowStationForm] = useState(false);
  const [stationData, setStationData] = useState({ name: '', latitude: '', longitude: '' });

  // 🟢 LÓGICA DE RETRASO SATELITAL
  const SATELLITE_LAG_DAYS = 5;

  // Los inputs type="date" manejan YYYY-MM-DD nativamente
  const [syncDates, setSyncDates] = useState({
      start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
  });

  // Detector de fechas recientes
  const isRecentDateSelected = () => {
      if (!syncDates.end) return false;
      const today = new Date();
      const selectedEnd = new Date(syncDates.end);
      const diffTime = Math.abs(today - selectedEnd);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays < SATELLITE_LAG_DAYS;
  };

  useEffect(() => {
    loadStations();
  }, []);

  useEffect(() => {
    if (selectedStation) {
      loadRecords(selectedStation.id);
    }
  }, [selectedStation]);

  const loadStations = async () => {
    try {
      const res = await api.get('/precipitaciones/stations/');
      setStations(res.data);
      if (res.data.length > 0) {
        setSelectedStation(res.data[0]);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const loadRecords = async (stationId) => {
    setLoading(true);
    try {
      const res = await api.get('/precipitaciones/records/');
      
      // Filtrar por estación
      const stationRecords = res.data.filter(r => r.station === stationId);
      
      // 🟢 ORDENAMIENTO ROBUSTO (Arregla el problema de "no salen")
      stationRecords.sort((a, b) => {
          // Convertimos ambas fechas a un número comparable (Timestamp)
          const dateA = a.date.includes('/') 
              ? new Date(a.date.split('/').reverse().join('-')).getTime() 
              : new Date(a.date).getTime();
              
          const dateB = b.date.includes('/') 
              ? new Date(b.date.split('/').reverse().join('-')).getTime() 
              : new Date(b.date).getTime();

          return dateB - dateA; // Más reciente primero
      });

      setRecords(stationRecords);
    } catch (error) {
      toast.error("Error cargando lluvias.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 🛰️ SINCRONIZACIÓN CON CHIRPS
  const handleSatelliteSync = async () => {
    if (!selectedStation) return;
    
    if (new Date(syncDates.start) > new Date(syncDates.end)) {
        return toast.error("La fecha de inicio no puede ser mayor a la final.");
    }

    setSyncing(true);
    const toastId = toast.loading(`Consultando satélites...`);

    try {
      // 🟢 CORRECCIÓN: Enviamos YYYY-MM-DD directo (sin inputToApiFormat)
      // El backend espera YYYY-MM-DD, que es lo que tienen syncDates.start/end
      const res = await api.post(`/precipitaciones/stations/${selectedStation.id}/fetch_chirps/`, {
          start_date: syncDates.start, 
          end_date: syncDates.end
      });
      
      const message = res.data.message || "";
      const countMatch = message.match(/(\d+)/);
      const count = res.data.count !== undefined ? res.data.count : (countMatch ? parseInt(countMatch[0]) : 0);
      
      if (count > 0) {
           toast.success(`Se descargaron ${count} registros nuevos.`, { id: toastId });
           loadRecords(selectedStation.id);
      } else {
           toast.dismiss(toastId);
           if (isRecentDateSelected()) {
               toast.custom((t) => (
                 <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-yellow-400`}>
                   <div className="flex-1 w-0 p-4">
                     <div className="flex items-start">
                       <div className="flex-shrink-0 pt-0.5"><Info className="h-10 w-10 text-yellow-400" /></div>
                       <div className="ml-3 flex-1">
                         <p className="text-sm font-bold text-gray-900">Sin datos satelitales recientes</p>
                         <p className="mt-1 text-sm text-gray-500">
                           Los satélites tienen un retraso de ~{SATELLITE_LAG_DAYS} días.
                         </p>
                         <button 
                           onClick={() => { toast.dismiss(t.id); setShowForm(true); }}
                           className="mt-2 text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded font-bold hover:bg-yellow-200 transition-colors"
                         >
                           👉 Registrar Manualmente
                         </button>
                       </div>
                     </div>
                   </div>
                   <button onClick={() => toast.dismiss(t.id)} className="border-l border-gray-200 p-4 text-gray-400 hover:text-gray-500"><X size={16}/></button>
                 </div>
               ), { duration: 6000 });
           } else {
               toast.error("No se encontraron datos para este periodo.", { id: toastId });
           }
      }

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || "Error de conexión con Earth Engine.";
      toast.error(msg, { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStation) return toast.error("Selecciona una estación");
    const mmValue = parseFloat(formData.mm);
    try {
      await api.post('/precipitaciones/records/', {
        station: selectedStation.id, 
        // 🟢 CORRECCIÓN: Enviamos YYYY-MM-DD directo
        date: formData.date, 
        precipitation_mm: mmValue, effective_precipitation_mm: mmValue, source: 'MANUAL'
      });
      toast.success("Registrado"); setShowForm(false); setFormData({ date: '', mm: '' });
      loadRecords(selectedStation.id);
    } catch (error) { toast.error("Error guardando"); }
  };

  const handleStationSubmit = async (e) => {
      e.preventDefault();
      try {
          const res = await api.post('/precipitaciones/stations/', {
              name: stationData.name, latitude: parseFloat(stationData.latitude), longitude: parseFloat(stationData.longitude)
          });
          toast.success("Estación creada");
          setStations([...stations, res.data]); setSelectedStation(res.data);
          setShowStationForm(false); setStationData({ name: '', latitude: '', longitude: '' });
      } catch (error) { toast.error("Error creando estación"); }
  };

  const handleDelete = async (id) => {
    if(!confirm("¿Borrar?")) return;
    try { await api.delete(`/precipitaciones/records/${id}/`); toast.success("Eliminado"); setRecords(prev => prev.filter(r => r.id !== id)); } 
    catch (error) { toast.error("Error"); }
  };

  if (stations.length === 0 && !loading) return (
    <div className="p-12 text-center border-dashed border-2 rounded-xl mt-8">
        <CloudRain size={48} className="mx-auto text-gray-300 mb-4"/>
        <h3 className="text-xl font-bold text-gray-600">No tienes Estaciones Pluviométricas</h3>
        <p className="text-gray-500 mb-4">Registra la ubicación para descargar datos satelitales.</p>
        <button onClick={() => setShowStationForm(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Crear Estación</button>
        {showStationForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md text-left">
                    <h3 className="text-xl font-bold mb-4">Nueva Estación</h3>
                    <form onSubmit={handleStationSubmit} className="space-y-4">
                        <input type="text" placeholder="Nombre" required className="w-full border p-2 rounded" value={stationData.name} onChange={e => setStationData({...stationData, name: e.target.value})}/>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="number" placeholder="Latitud" required className="w-full border p-2 rounded" value={stationData.latitude} onChange={e => setStationData({...stationData, latitude: e.target.value})}/>
                            <input type="number" placeholder="Longitud" required className="w-full border p-2 rounded" value={stationData.longitude} onChange={e => setStationData({...stationData, longitude: e.target.value})}/>
                        </div>
                        <div className="flex gap-2 mt-4"><button type="button" onClick={() => setShowStationForm(false)} className="flex-1 bg-gray-100 py-2 rounded">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded">Guardar</button></div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-agri-dark flex items-center gap-2">
            <CloudRain className="text-blue-500" size={32} />
            Control de Precipitaciones
          </h1>
          <p className="text-gray-500 text-sm">Gestiona la entrada de agua natural al sistema.</p>
        </div>

        <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase">Estación:</span>
                <select className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer" value={selectedStation?.id} onChange={(e) => setSelectedStation(stations.find(st => st.id === parseInt(e.target.value)))}>
                    {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <button onClick={() => { setStationData({ name: '', latitude: '', longitude: '' }); setShowStationForm(true); }} className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100"><Plus size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PANEL IZQUIERDO */}
        <div className="space-y-6">
            
            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                <Satellite className="absolute -right-6 -bottom-6 text-white opacity-10" size={120} />
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Satellite size={20} className="text-blue-300"/> Conexión CHIRPS
                </h3>
                
                <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                    <div>
                        <label className="text-[10px] text-blue-200 uppercase font-bold block mb-1">Desde</label>
                        <input type="date" className="w-full bg-white/10 border border-white/20 rounded p-2 text-sm text-white" value={syncDates.start} onChange={(e) => setSyncDates({...syncDates, start: e.target.value})}/>
                    </div>
                    <div>
                        <label className="text-[10px] text-blue-200 uppercase font-bold block mb-1">Hasta</label>
                        <input type="date" className="w-full bg-white/10 border border-white/20 rounded p-2 text-sm text-white" value={syncDates.end} max={new Date().toISOString().split('T')[0]} onChange={(e) => setSyncDates({...syncDates, end: e.target.value})}/>
                    </div>
                </div>

                {isRecentDateSelected() && (
                    <div className="mb-4 bg-yellow-500/20 border border-yellow-400/30 p-2 rounded-lg flex items-start gap-2 relative z-10">
                        <AlertTriangle size={16} className="text-yellow-300 shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-100 leading-tight">
                            <strong>Aviso:</strong> Fechas muy recientes. Es probable que el satélite aún no tenga datos (Delay: {SATELLITE_LAG_DAYS} días).
                        </p>
                    </div>
                )}

                <p className="text-blue-200 text-xs mb-4 italic">
                    * Datos históricos de lluvia para <strong>{selectedStation?.name}</strong>.
                </p>

                <button 
                    onClick={handleSatelliteSync}
                    disabled={syncing}
                    className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 shadow-md disabled:opacity-70 relative z-10"
                >
                    {syncing ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
                    {syncing ? 'Descargando...' : 'Buscar Datos'}
                </button>
            </div>

            <button onClick={() => setShowForm(!showForm)} className="w-full bg-white border-2 border-dashed border-gray-300 hover:border-blue-500 text-gray-500 hover:text-blue-600 font-bold py-4 rounded-xl flex justify-center items-center gap-2">
                <Plus size={20} /> Registrar Lluvia Manual
            </button>

            {showForm && (
                <form onSubmit={handleManualSubmit} className="bg-white p-4 rounded-xl shadow border border-gray-100 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-3">
                        <div><label className="text-xs font-bold text-gray-500">Fecha</label><input type="date" required className="w-full border p-2 rounded" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/></div>
                        <div><label className="text-xs font-bold text-gray-500">Milímetros (mm)</label><input type="number" step="0.1" required className="w-full border p-2 rounded" value={formData.mm} onChange={e => setFormData({...formData, mm: e.target.value})}/></div>
                        <button type="submit" className="w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700">Guardar Registro</button>
                    </div>
                </form>
            )}
        </div>

        {/* LISTADO DE REGISTROS */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-gray-700">Historial de Precipitaciones</h3>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{records.length} registros</span>
            </div>
            
            <div className="overflow-y-auto flex-1">
                {records.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <Droplets size={48} className="mb-2 opacity-20"/>
                        <p>No hay lluvias registradas en este periodo.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 bg-gray-50">Fecha</th>
                                <th className="px-6 py-3 bg-gray-50">Cantidad</th>
                                <th className="px-6 py-3 bg-gray-50">Fuente</th>
                                <th className="px-6 py-3 bg-gray-50 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.map((r) => (
                                <tr key={r.id} className="hover:bg-blue-50/50 transition-colors">
                                    {/* 🟢 SOLO VISUALIZACIÓN: Convertimos a DD/MM/YYYY para leerlo fácil */}
                                    <td className="px-6 py-4 font-medium text-gray-900 font-mono">
                                        {toStandardDate(r.date)}
                                    </td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2"><span className="font-bold text-blue-600 text-lg">{r.effective_precipitation_mm}</span><span className="text-xs text-gray-400">mm</span></div></td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${r.source === 'SATELLITE' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-green-50 text-green-700 border-green-200'}`}>{r.source === 'SATELLITE' ? '🛰️ CHIRPS' : '👤 MANUAL'}</span></td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => handleDelete(r.id)} className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full"><Trash2 size={16} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
      </div>
      
      {/* Modal Nueva Estación */}
      {showStationForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md text-left">
                <h3 className="text-xl font-bold mb-4">Nueva Estación</h3>
                <form onSubmit={handleStationSubmit} className="space-y-4">
                    <input type="text" placeholder="Nombre" required className="w-full border p-2 rounded" value={stationData.name} onChange={e => setStationData({...stationData, name: e.target.value})}/>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="Latitud" required className="w-full border p-2 rounded" value={stationData.latitude} onChange={e => setStationData({...stationData, latitude: e.target.value})}/>
                        <input type="number" placeholder="Longitud" required className="w-full border p-2 rounded" value={stationData.longitude} onChange={e => setStationData({...stationData, longitude: e.target.value})}/>
                    </div>
                    <div className="flex gap-2 mt-4"><button type="button" onClick={() => setShowStationForm(false)} className="flex-1 bg-gray-100 py-2 rounded">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded">Guardar</button></div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}