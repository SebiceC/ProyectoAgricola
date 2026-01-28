import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { 
  CloudRain, MapPin, Plus, Calendar, Droplets, 
  History, Trash2, TrendingDown 
} from 'lucide-react';

export default function PrecipitationManager() {
  const [stations, setStations] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formularios
  const [newStation, setNewStation] = useState({ name: '', latitude: '', longitude: '' });
  const [newRecord, setNewRecord] = useState({ 
    station: '', 
    date: new Date().toISOString().split('T')[0], // Hoy por defecto
    precipitation_mm: '' 
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [stationsRes, recordsRes] = await Promise.all([
        api.get('/precipitaciones/stations/'),
        api.get('/precipitaciones/records/')
      ]);
      setStations(stationsRes.data);
      setRecords(recordsRes.data);
      
      // Auto-seleccionar la primera estación si existe y no hay una seleccionada
      if (stationsRes.data.length > 0 && !newRecord.station) {
        setNewRecord(prev => ({ ...prev, station: stationsRes.data[0].id }));
      }
    } catch (error) {
      console.error(error);
      toast.error("Error cargando datos de lluvias");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE ESTACIONES ---
  const handleCreateStation = async (e) => {
    e.preventDefault();
    if (!newStation.name) return toast.error("El nombre es obligatorio");

    try {
      await api.post('/precipitaciones/stations/', newStation);
      toast.success("Estación creada correctamente");
      setNewStation({ name: '', latitude: '', longitude: '' });
      fetchData();
    } catch (error) {
      toast.error("Error creando estación");
    }
  };

  const handleDeleteStation = async (id) => {
    if(!confirm("¿Borrar estación? Se perderán sus registros asociados.")) return;
    try {
      await api.delete(`/precipitaciones/stations/${id}/`);
      toast.success("Estación eliminada");
      fetchData();
    } catch (error) {
      toast.error("No se pudo eliminar");
    }
  };

  // --- LÓGICA DE REGISTROS DE LLUVIA ---
  const handleCreateRecord = async (e) => {
    e.preventDefault();
    if (!newRecord.station || !newRecord.date || newRecord.precipitation_mm === '') {
      return toast.error("Complete todos los datos de la lluvia");
    }

    try {
      await api.post('/precipitaciones/records/', {
        station: newRecord.station,
        date: newRecord.date,
        precipitation_mm: parseFloat(newRecord.precipitation_mm)
      });
      toast.success("Registro guardado. ¡El riego se recalculará!");
      setNewRecord({ ...newRecord, precipitation_mm: '' }); // Limpiamos solo los mm
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar registro (quizás ya existe uno para esa fecha)");
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando módulo de lluvias...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-agri-dark flex items-center gap-2">
            <CloudRain className="text-blue-500" size={32} />
            Control de Precipitaciones
          </h1>
          <p className="text-gray-500 text-sm">Registra las lluvias para descontarlas del riego (Lluvia Efectiva).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA 1: GESTIÓN DE ESTACIONES (INFRAESTRUCTURA) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <MapPin size={18} /> Nueva Estación
            </h3>
            <form onSubmit={handleCreateStation} className="space-y-3">
              <input 
                type="text" 
                placeholder="Nombre (Ej: Lote Norte)" 
                className="w-full p-2 border rounded bg-gray-50"
                value={newStation.name}
                onChange={e => setNewStation({...newStation, name: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="number" step="any" placeholder="Lat" 
                  className="w-full p-2 border rounded bg-gray-50 text-xs"
                  value={newStation.latitude}
                  onChange={e => setNewStation({...newStation, latitude: e.target.value})}
                />
                <input 
                  type="number" step="any" placeholder="Lon" 
                  className="w-full p-2 border rounded bg-gray-50 text-xs"
                  value={newStation.longitude}
                  onChange={e => setNewStation({...newStation, longitude: e.target.value})}
                />
              </div>
              <button className="w-full bg-slate-700 text-white py-2 rounded hover:bg-slate-800 flex justify-center items-center gap-1">
                <Plus size={16} /> Crear Estación
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mis Estaciones</h4>
            {stations.map(st => (
              <div key={st.id} className="bg-white p-4 rounded-lg border border-gray-100 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-bold text-gray-800">{st.name}</p>
                  <p className="text-xs text-gray-400">Lat: {st.latitude || 'N/A'} | Lon: {st.longitude || 'N/A'}</p>
                </div>
                <button onClick={() => handleDeleteStation(st.id)} className="text-red-400 hover:text-red-600 p-2">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {stations.length === 0 && <p className="text-sm text-gray-400 italic">No tienes estaciones registradas.</p>}
          </div>
        </div>

        {/* COLUMNA 2 y 3: REGISTRO DE DATOS Y TABLA */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* FORMULARIO DE LLUVIA DIARIA */}
          <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-xl border border-blue-100 shadow-sm">
            <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
              <Droplets size={20} /> Registrar Lluvia (mm)
            </h3>
            
            {stations.length > 0 ? (
              <form onSubmit={handleCreateRecord} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-1">
                  <label className="text-xs font-bold text-gray-500">Estación</label>
                  <select 
                    className="w-full p-2 border rounded bg-white"
                    value={newRecord.station}
                    onChange={e => setNewRecord({...newRecord, station: e.target.value})}
                  >
                    {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                
                <div className="md:col-span-1">
                  <label className="text-xs font-bold text-gray-500">Fecha</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded bg-white"
                    value={newRecord.date}
                    onChange={e => setNewRecord({...newRecord, date: e.target.value})}
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="text-xs font-bold text-gray-500">Milímetros (mm)</label>
                  <input 
                    type="number" step="0.1" min="0" 
                    placeholder="0.0"
                    className="w-full p-2 border rounded bg-white border-blue-200 focus:ring-2 focus:ring-blue-200"
                    value={newRecord.precipitation_mm}
                    onChange={e => setNewRecord({...newRecord, precipitation_mm: e.target.value})}
                  />
                </div>

                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded md:col-span-1 h-[42px]">
                  Guardar
                </button>
              </form>
            ) : (
              <p className="text-orange-500 font-medium text-sm">⚠️ Crea una estación primero para poder registrar lluvias.</p>
            )}
          </div>

          {/* HISTORIAL TABLA */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-2 bg-gray-50">
              <History size={18} className="text-gray-500" />
              <h3 className="font-bold text-gray-700">Historial Reciente</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3">Estación</th>
                    <th className="px-6 py-3 text-right">Lluvia Bruta</th>
                    <th className="px-6 py-3 text-right">Lluvia Efectiva (Riego)</th>
                    <th className="px-6 py-3 text-center">Fuente</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec.id} className="border-b hover:bg-blue-50/30">
                      <td className="px-6 py-4 font-medium text-gray-900">{rec.date}</td>
                      <td className="px-6 py-4">{stations.find(s => s.id === rec.station)?.name || '...'}</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600">
                        {rec.precipitation_mm} mm
                      </td>
                      <td className="px-6 py-4 text-right text-green-600 font-bold flex justify-end items-center gap-1">
                         {rec.effective_precipitation_mm} mm <TrendingDown size={14} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded text-xs font-mono">
                          {rec.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                        No hay registros de lluvias aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}