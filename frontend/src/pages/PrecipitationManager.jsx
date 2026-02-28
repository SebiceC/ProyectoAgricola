import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import {
  CloudRain, Satellite, Plus, Trash2, Calendar,
  RefreshCw, Droplets, MapPin, AlertTriangle, Info, X, Search,
  Save, FileSpreadsheet, Image as ImageIcon, BookOpen, Eye
} from 'lucide-react';

// Importamos solo toStandardDate para VISUALIZAR, ya no convertimos para ENVIAR
// Importamos solo toStandardDate para VISUALIZAR, ya no convertimos para ENVIAR
import { toStandardDate } from '../utils/dateUtils';

// Importaciones para Gráficas y Excel
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import React, { useRef } from 'react';

export default function PrecipitationManager() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [globalSyncing, setGlobalSyncing] = useState(false);

  // Estado para Lluvia Manual
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ date: '', mm: '' });

  // Estado para Nueva Estación
  const [showStationForm, setShowStationForm] = useState(false);
  const [stationData, setStationData] = useState({ name: '', latitude: '', longitude: '' });

  // 🟢 LÓGICA DE RETRASO SATELITAL
  const SATELLITE_LAG_DAYS = 5;

  // Los inputs type="date" manejan YYYY-MM-DD nativamente
  // Los inputs type="date" manejan YYYY-MM-DD nativamente
  const [syncDates, setSyncDates] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // ====== ESTADOS PARA ANÁLISIS HISTÓRICO ======
  const [activeTab, setActiveTab] = useState('DAILY'); // 'DAILY' o 'HISTORICAL'

  const [historicalParams, setHistoricalParams] = useState({
    start_date: `${new Date().getFullYear() - 5}-01-01`, // Por defecto últimos 5 años
    end_date: new Date().toISOString().split('T')[0]
  });

  const [historicalData, setHistoricalData] = useState([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const chartRef = useRef(null); // Ref for image export

  // ====== ESTADOS PARA BIBLIOTECA DE ESTUDIOS ======
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [studyName, setStudyName] = useState('');
  const [savedStudies, setSavedStudies] = useState([]);

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
    if (activeTab === 'LIBRARY') {
      loadSavedStudies();
    }
  }, [activeTab]);

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
              <button onClick={() => toast.dismiss(t.id)} className="border-l border-gray-200 p-4 text-gray-400 hover:text-gray-500"><X size={16} /></button>
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
    if (!confirm("¿Borrar?")) return;
    try { await api.delete(`/precipitaciones/records/${id}/`); toast.success("Eliminado"); setRecords(prev => prev.filter(r => r.id !== id)); }
    catch (error) { toast.error("Error"); }
  };

  // ====== FUNCIONES PARA HISTÓRICO ======
  const generateHistoricalAnalysis = async () => {
    if (!selectedStation) return toast.error("Seleccione una estación primero");
    if (new Date(historicalParams.start_date) > new Date(historicalParams.end_date)) {
      return toast.error("Fecha inicio mayor a fecha final");
    }

    setLoadingHistorical(true);
    const toastId = toast.loading("Calculando histórico mensual...");

    try {
      const res = await api.get(`/precipitaciones/stations/${selectedStation.id}/historical_analysis/`, {
        params: {
          start_date: historicalParams.start_date,
          end_date: historicalParams.end_date
        }
      });

      setHistoricalData(res.data);

      if (res.data.length === 0) {
        toast.error("No se encontraron registros de lluvia en el periodo seleccionado.", { id: toastId });
      } else {
        toast.success("Análisis histórico generado", { id: toastId });
      }

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Error al generar histórico", { id: toastId });
    } finally {
      setLoadingHistorical(false);
    }
  };

  const handleExportExcel = () => {
    if (historicalData.length === 0) return toast.error("No hay datos para exportar");
    const wb = XLSX.utils.book_new();

    // Mapear los datos para Excel
    const exportData = historicalData.map(item => ({
      "Mes": item.month_name,
      "Precipitación Promedio (mm)": item.precipitation
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Lluvia Histórica");
    XLSX.writeFile(wb, `Precipitaciones_${selectedStation.name.replace(/\s+/g, '_')}_${historicalParams.start_date}.xlsx`);
  };

  const handleExportImage = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#fff', scale: 2 });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/png");
      link.download = `Grafica_LLuvia_${selectedStation.name.replace(/\s+/g, '_')}.png`;
      link.click();
    } catch (e) {
      toast.error("Error exportando imagen");
    }
  };

  // ====== FUNCIONES DE BIBLIOTECA (ESTUDIOS GUARDADOS) ======
  const loadSavedStudies = async () => {
    try {
      const res = await api.get('/precipitaciones/studies/');
      setSavedStudies(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveStudy = async () => {
    if (!studyName.trim()) return toast.error("Ingresa un nombre para el estudio");
    if (!selectedStation) return toast.error("Falta seleccionar estación");
    if (historicalData.length === 0) return toast.error("No hay datos para guardar");

    const payload = {
      name: studyName,
      station: selectedStation.id,
      start_date: historicalParams.start_date,
      end_date: historicalParams.end_date,
      result_data: historicalData
    };

    try {
      await api.post('/precipitaciones/studies/', payload);
      toast.success("Estudio guardado correctamente");
      setShowSaveModal(false);
      setStudyName('');
      loadSavedStudies();
    } catch (error) {
      toast.error("Error al guardar el estudio");
    }
  };

  const handleDeleteStudy = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este estudio de tu historial?")) return;
    try {
      await api.delete(`/precipitaciones/studies/${id}/`);
      toast.success("Estudio eliminado");
      loadSavedStudies();
    } catch (error) {
      toast.error("Error eliminando estudio");
    }
  };

  const handleLoadStudy = (study) => {
    // Buscar la estación que tiene este ID dentro del arreglo `stations`
    const stationObj = stations.find(s => s.id === study.station);
    if (stationObj) {
      setSelectedStation(stationObj);
    }

    setHistoricalParams({ start_date: study.start_date, end_date: study.end_date });
    setHistoricalData(study.result_data);
    setActiveTab('HISTORICAL');
  };

  const handleSyncHistory = async () => {
    if (!selectedStation) return toast.error("Seleccione una estación primero");
    if (!window.confirm("¿Desea sincronizar el rango de fechas seleccionado de precipitaciones satelitales a la base de datos operativa? (Esto no sobrescribe datos manuales)")) return;

    setGlobalSyncing(true);
    const toastId = toast.loading(`Sincronizando CHIRPS (${historicalParams.start_date} a ${historicalParams.end_date})...`);

    try {
      const payload = {
        start_date: historicalParams.start_date,
        end_date: historicalParams.end_date
      };
      const res = await api.post(`/precipitaciones/stations/${selectedStation.id}/sync_history/`, payload);
      toast.success(res.data.message || "Sincronización exitosa", { id: toastId });
      if (activeTab === 'DAILY') {
        loadRecords(selectedStation.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error en sincronización satelital", { id: toastId });
    } finally {
      setGlobalSyncing(false);
    }
  };
  // ======================================

  if (stations.length === 0 && !loading) return (
    <div className="p-12 text-center border-dashed border-2 rounded-xl mt-8">
      <CloudRain size={48} className="mx-auto text-gray-300 mb-4" />
      <h3 className="text-xl font-bold text-gray-600">No tienes Estaciones Pluviométricas</h3>
      <p className="text-gray-500 mb-4">Registra la ubicación para descargar datos satelitales.</p>
      <button onClick={() => setShowStationForm(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Crear Estación</button>
      {showStationForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md text-left">
            <h3 className="text-xl font-bold mb-4">Nueva Estación</h3>
            <form onSubmit={handleStationSubmit} className="space-y-4">
              <input type="text" placeholder="Nombre" required className="w-full border p-2 rounded" value={stationData.name} onChange={e => setStationData({ ...stationData, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Latitud" required className="w-full border p-2 rounded" value={stationData.latitude} onChange={e => setStationData({ ...stationData, latitude: e.target.value })} />
                <input type="number" placeholder="Longitud" required className="w-full border p-2 rounded" value={stationData.longitude} onChange={e => setStationData({ ...stationData, longitude: e.target.value })} />
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

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-8">
        <button
          className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 ${activeTab === 'DAILY' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          onClick={() => setActiveTab('DAILY')}
        >
          Operación Diaria
        </button>
        <button
          className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 ${activeTab === 'HISTORICAL' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          onClick={() => setActiveTab('HISTORICAL')}
        >
          Análisis Histórico
        </button>
        <button
          className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 ${activeTab === 'LIBRARY' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          onClick={() => setActiveTab('LIBRARY')}
        >
          Estudios Guardados
        </button>
      </div>

      {activeTab === 'DAILY' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* PANEL IZQUIERDO */}
          <div className="space-y-6">

            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
              <Satellite className="absolute -right-6 -bottom-6 text-white opacity-10" size={120} />
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Satellite size={20} className="text-blue-300" /> Conexión CHIRPS
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                <div>
                  <label className="text-[10px] text-blue-200 uppercase font-bold block mb-1">Desde</label>
                  <input type="date" className="w-full bg-white/10 border border-white/20 rounded p-2 text-sm text-white" value={syncDates.start} onChange={(e) => setSyncDates({ ...syncDates, start: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] text-blue-200 uppercase font-bold block mb-1">Hasta</label>
                  <input type="date" className="w-full bg-white/10 border border-white/20 rounded p-2 text-sm text-white" value={syncDates.end} max={new Date().toISOString().split('T')[0]} onChange={(e) => setSyncDates({ ...syncDates, end: e.target.value })} />
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
                  <div><label className="text-xs font-bold text-gray-500">Fecha</label><input type="date" required className="w-full border p-2 rounded" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} /></div>
                  <div><label className="text-xs font-bold text-gray-500">Milímetros (mm)</label><input type="number" step="0.1" required className="w-full border p-2 rounded" value={formData.mm} onChange={e => setFormData({ ...formData, mm: e.target.value })} /></div>
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
                  <Droplets size={48} className="mb-2 opacity-20" />
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
      ) : (
        /* ====== PESTAÑA DE ANÁLISIS HISTÓRICO ====== */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

          {/* Controles del Histórico */}
          <div className="flex flex-col md:flex-row gap-4 items-end mb-8 bg-gray-50 p-4 rounded-lg border">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Desde (Año-Mes-Día)</label>
              <input
                type="date"
                className="w-full border p-2 rounded text-sm font-mono"
                value={historicalParams.start_date}
                onChange={(e) => setHistoricalParams({ ...historicalParams, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Hasta (Año-Mes-Día)</label>
              <input
                type="date"
                className="w-full border p-2 rounded text-sm font-mono"
                value={historicalParams.end_date}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setHistoricalParams({ ...historicalParams, end_date: e.target.value })}
              />
            </div>
            <button
              onClick={generateHistoricalAnalysis}
              disabled={loadingHistorical}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded flex items-center gap-2 disabled:opacity-50"
            >
              {loadingHistorical ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
              Generar Gráfica
            </button>
          </div>

          {/* Resultados del Histórico */}
          {historicalData.length > 0 && (
            <div className="space-y-8 animate-in fade-in run-in-from-bottom-4">

              {/* Contenedor de la Gráfica */}
              <div ref={chartRef} className="border rounded-xl p-4 md:p-8 bg-white mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Precipitación Promedio Histórica</h3>
                    <p className="text-sm text-gray-500 uppercase tracking-wide mt-1">
                      {selectedStation?.name} | {historicalParams.start_date} - {historicalParams.end_date}
                    </p>
                  </div>

                  {/* Botonera de Acciones (Estilo Unificado con Clima) */}
                  <div className="flex gap-2 flex-wrap justify-end">
                    <button
                      onClick={handleSyncHistory}
                      disabled={globalSyncing}
                      className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-100 disabled:opacity-50"
                      title="Sincronizar último año a Base de Datos Operativa"
                    >
                      <RefreshCw size={16} className={globalSyncing ? "animate-spin" : ""} />
                      {globalSyncing ? "Sincronizando..." : "Sincronizar"}
                    </button>
                    <div className="w-px bg-gray-300 mx-1 h-8 hidden md:block"></div>
                    <button onClick={handleExportExcel} className="bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-green-100">
                      <FileSpreadsheet size={16} /> Excel
                    </button>
                    <button onClick={handleExportImage} className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-purple-100">
                      <ImageIcon size={16} /> Imagen
                    </button>
                    <div className="w-px bg-gray-300 mx-1 h-8 hidden md:block"></div>
                    <button onClick={() => setShowSaveModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow hover:bg-blue-700 flex items-center gap-2">
                      <Save size={16} /> Guardar
                    </button>
                  </div>
                </div>

                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={historicalData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="month_name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} domain={[0, 'auto']} />
                      <RechartsTooltip
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`${value} mm`, "Precipitación Promedio"]}
                        labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                      />
                      <Bar
                        dataKey="precipitation"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                      >
                        {historicalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.precipitation > 100 ? '#2563eb' : '#60a5fa'} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabla de Datos Históricos */}
              <div className="border rounded-xl overflow-hidden">
                <div className="p-4 bg-gray-50 flex justify-between items-center border-b">
                  <h4 className="font-bold text-gray-700">Promedios Mensuales Estimados Desglosados</h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 font-bold border-r">Mes</th>
                        <th className="px-6 py-3 font-bold text-blue-600 bg-blue-50/30">Promedio Mensual Estimado (mm/mes)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {historicalData.map((row) => (
                        <tr key={row.month} className="hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium text-gray-900 border-r">{row.month_name}</td>
                          <td className="px-6 py-3 font-mono font-bold text-blue-600 bg-blue-50/10">
                            {row.precipitation.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                      {/* Fila de Total Anual */}
                      <tr className="bg-gray-100 font-bold border-t-2 border-gray-200">
                        <td className="px-6 py-4 text-right border-r text-gray-700 uppercase">Total Anual Estimado</td>
                        <td className="px-6 py-4 text-xl text-blue-700">
                          {historicalData.reduce((acc, curr) => acc + curr.precipitation, 0).toFixed(1)} <span className="text-xs text-gray-500 font-normal">mm/año</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* PESTAÑA BIBLIOTECA DE ESTUDIOS (Replicada de ClimateEto.jsx) */}
      {activeTab === 'LIBRARY' && (
        <div className="animate-in fade-in">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Mis Estudios</h3>
                <p className="text-xs text-gray-500">Historial guardado.</p>
              </div>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">{savedStudies.length} Estudios</span>
            </div>

            {savedStudies.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                <p>Sin estudios guardados.</p>
                <button onClick={() => setActiveTab('HISTORICAL')} className="mt-4 text-blue-600 text-sm font-bold hover:underline">Crear nuevo</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {savedStudies.map((s) => (
                  <div key={s.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-800 line-clamp-1">{s.name}</h4>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border">{s.created_at?.split('T')[0]}</span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1 mb-4 flex-1">
                      <p className="flex items-center gap-1"><MapPin size={10} /> {stations.find(st => st.id === s.station)?.name || "Estación Desconocida"}</p>
                      <p className="flex items-center gap-1"><Calendar size={10} /> {s.start_date} / {s.end_date}</p>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <button onClick={() => handleLoadStudy(s)} className="flex-1 bg-purple-50 text-purple-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-purple-100"><Eye size={14} /> Ver</button>
                      <button onClick={() => handleDeleteStudy(s.id)} className="px-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Guardar Estudio */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2"><Save size={20} className="text-green-600" /> Guardar Análisis</h3>
            <div className="mb-6"><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Nombre</label><input autoFocus type="text" value={studyName} onChange={e => setStudyName(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg outline-none" /></div>
            <div className="flex justify-end gap-3"><button onClick={() => setShowSaveModal(false)} className="text-gray-600 font-bold text-sm px-4 py-2 hover:bg-gray-100 rounded-lg">Cancelar</button><button onClick={handleSaveStudy} disabled={!studyName.trim()} className="bg-green-600 text-white font-bold text-sm px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">Guardar</button></div>
          </div>
        </div>
      )}

      {/* Modal Nueva Estación */}
      {showStationForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md text-left">
            <h3 className="text-xl font-bold mb-4">Nueva Estación</h3>
            <form onSubmit={handleStationSubmit} className="space-y-4">
              <input type="text" placeholder="Nombre" required className="w-full border p-2 rounded" value={stationData.name} onChange={e => setStationData({ ...stationData, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Latitud" required className="w-full border p-2 rounded" value={stationData.latitude} onChange={e => setStationData({ ...stationData, latitude: e.target.value })} />
                <input type="number" placeholder="Longitud" required className="w-full border p-2 rounded" value={stationData.longitude} onChange={e => setStationData({ ...stationData, longitude: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-4"><button type="button" onClick={() => setShowStationForm(false)} className="flex-1 bg-gray-100 py-2 rounded">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded">Guardar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}