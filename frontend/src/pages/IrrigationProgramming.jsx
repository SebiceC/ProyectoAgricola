import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { 
  Droplets, Sprout, ArrowRight, AlertTriangle, CheckCircle, 
  Calendar, Activity, CloudRain, Sun, History 
} from 'lucide-react';

import IrrigationChart from './IrrigationChart';

export default function IrrigationProgramming() {
  // --- ESTADOS GLOBALES ---
  const [plantings, setPlantings] = useState([]);
  const [soils, setSoils] = useState([]);
  const [cropsCatalog, setCropsCatalog] = useState({});
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE INTERACCIÓN ---
  const [selectedSoil, setSelectedSoil] = useState({});
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null); // Receta de riego actual
  const [chartData, setChartData] = useState([]); // Datos para la gráfica CROPWAT

  // Carga inicial de datos
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plantRes, soilRes, cropsRes] = await Promise.all([
        api.get('/cultivo/plantings/'),
        api.get('/suelo/soils/'),
        api.get('/cultivo/crops/') 
      ]);
      
      const cropMap = {};
      cropsRes.data.forEach(crop => {
        cropMap[crop.id] = crop.nombre;
      });

      setPlantings(plantRes.data);
      setSoils(soilRes.data);
      setCropsCatalog(cropMap);
      
    } catch (error) {
      console.error(error);
      toast.error("Error cargando datos del sistema");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA: VINCULAR SUELO ---
  const handleAssignSoil = async (plantingId) => {
    const soilId = selectedSoil[plantingId];
    if (!soilId) {
      toast.error("Por favor selecciona un suelo");
      return;
    }

    const currentPlanting = plantings.find(p => p.id === plantingId);
    if (!currentPlanting) return;

    try {
      await api.patch(`/cultivo/plantings/${plantingId}/`, { 
        soil: soilId,
        crop: currentPlanting.crop 
      });
      toast.success("¡Suelo vinculado correctamente!");
      fetchData(); 
    } catch (error) {
      console.error(error);
      toast.error("Error al asignar el suelo.");
    }
  };

  // --- LÓGICA: CARGAR GRÁFICA HISTÓRICA ---
  const loadChartData = async (plantingId) => {
    try {
      const res = await api.get(`/cultivo/plantings/${plantingId}/water_balance_history/`);
      setChartData(res.data);
    } catch (error) {
      console.error("Error cargando gráfica histórica", error);
      // No mostramos toast de error para no saturar, simplemente la gráfica saldrá vacía
    }
  };

  // --- LÓGICA: CEREBRO DE RIEGO (CALCULAR) ---
  const handleCalculate = async (plantingId, cropName) => {
    setCalculating(true);
    setResult(null); 
    setChartData([]); // Limpiar gráfica anterior

    try {
      // 1. Obtener el cálculo numérico de hoy
      const res = await api.get(`/cultivo/plantings/${plantingId}/calculate_irrigation/`);
      
      // Añadimos el ID de la siembra al resultado para usarlo luego en la trazabilidad
      const fullResult = { 
        ...res.data, 
        cropName,
        planting_id: plantingId // Aseguramos tener el ID disponible
      };
      
      setResult(fullResult);
      toast.success("Cálculo realizado con éxito");

      // 2. Cargar la historia visual (Gráfica)
      await loadChartData(plantingId);

    } catch (error) {
      console.error(error);
      toast.error("No se pudo calcular. Verifica conexión NASA / Backend.");
    } finally {
      setCalculating(false);
    }
  };

  // --- LÓGICA: TRAZABILIDAD (CONFIRMAR RIEGO) ---
  const handleConfirmIrrigation = async () => {
    if (!result) return;

    // Validación de seguridad para no guardar ceros accidentalmente sin querer
    if (result.recomendacion.riego_sugerido_mm <= 0) {
      if(!confirm("La recomendación es 0 mm. ¿Deseas registrar en el historial que NO regaste hoy?")) return;
    }

    try {
      await api.post('/cultivo/executions/', {
        planting: result.planting_id || result.id, // Fallback de seguridad para el ID
        date: new Date().toISOString().split('T')[0], // Fecha Hoy YYYY-MM-DD
        water_volume_mm: result.recomendacion.riego_sugerido_mm,
        was_suggested: true
      });
      
      toast.success("✅ Ejecución guardada en el historial.");
      
      // Recargamos la gráfica para que se vea reflejado el "riego" nuevo (si fue > 0)
      loadChartData(result.planting_id);

    } catch (error) {
      console.error(error);
      toast.error("Error guardando el registro de auditoría.");
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-gray-500">Cargando motor de riego...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12">
      {/* HEADER PRINCIPAL */}
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-agri-dark flex items-center gap-3">
          <Droplets className="text-blue-600" size={36} />
          Programación de Riego Inteligente
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Sistema de decisión basado en balance hídrico (NASA POWER) y trazabilidad operativa.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === COLUMNA IZQUIERDA: LISTA DE CULTIVOS (Ancho 4/12) === */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-gray-700 text-lg">Mis Lotes Activos</h2>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
              {plantings.length}
            </span>
          </div>
          
          {plantings.map((plant) => {
            const hasSoil = plant.soil !== null && plant.soil !== undefined;
            const soilName = plant.soil?.nombre || 'Sin Suelo';
            const cropTypeName = cropsCatalog[plant.crop] || "Cultivo";
            const plantingName = plant.nombre || `Lote #${plant.id}`;

            return (
              <div key={plant.id} className={`p-5 rounded-xl border shadow-sm transition-all hover:shadow-md ${hasSoil ? 'bg-white border-gray-200' : 'bg-orange-50 border-orange-200'}`}>
                
                {/* Cabecera de la Tarjeta de Lote */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${hasSoil ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      <Sprout size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{cropTypeName}</h3>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">📍 {plantingName}</p>
                    </div>
                  </div>
                  {hasSoil ? (
                    <span className="text-green-600 bg-green-50 p-1 rounded-full" title="Listo para operar">
                      <CheckCircle size={18} />
                    </span>
                  ) : (
                    <span className="text-orange-500 bg-orange-100 p-1 rounded-full animate-pulse" title="Requiere configuración">
                      <AlertTriangle size={18} />
                    </span>
                  )}
                </div>

                {/* Acción: Vincular Suelo o Calcular */}
                {!hasSoil ? (
                  <div className="mt-3 bg-white p-3 rounded border border-orange-100">
                    <p className="text-xs text-gray-500 mb-2 font-bold">⚠️ Configuración Requerida:</p>
                    <div className="flex flex-col gap-2">
                      <select 
                        className="w-full p-2 border rounded text-xs bg-gray-50 outline-none"
                        onChange={(e) => setSelectedSoil({...selectedSoil, [plant.id]: e.target.value})}
                        defaultValue=""
                      >
                        <option value="" disabled>-- Seleccionar Suelo --</option>
                        {soils.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} ({s.textura || 'General'})
                          </option>
                        ))}
                      </select>
                      <button 
                        onClick={() => handleAssignSoil(plant.id)}
                        className="w-full bg-slate-700 hover:bg-slate-800 text-white py-2 rounded text-xs font-bold flex justify-center items-center gap-1"
                      >
                        Vincular Suelo <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <button 
                      onClick={() => handleCalculate(plant.id, cropTypeName)}
                      disabled={calculating}
                      className={`w-full py-3 rounded-lg font-bold shadow-sm transition-all flex justify-center items-center gap-2 
                        ${calculating ? 'bg-gray-300 text-gray-500 cursor-wait' : 'bg-agri-green hover:bg-green-700 text-white'}`}
                    >
                       {calculating ? 'Procesando...' : <><Droplets size={18} /> Calcular Riego</>}
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-2 flex justify-center items-center gap-1">
                      <Activity size={10} /> Suelo: {soilName}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* === COLUMNA DERECHA: PANEL DE RESULTADOS (Ancho 8/12) === */}
        <div className="lg:col-span-8">
          
          {/* ESTADO VACÍO (Placeholder) */}
          {!result && (
            <div className="h-full min-h-[500px] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col justify-center items-center text-center p-8">
              <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                <Droplets size={48} className="text-blue-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-400">Esperando Selección</h3>
              <p className="text-gray-400 max-w-md mt-2">
                Selecciona un cultivo en el menú de la izquierda y presiona "Calcular Riego" para iniciar el motor de inteligencia agronómica.
              </p>
            </div>
          )}

          {/* TARJETA DE RESULTADOS */}
          {result && (
            <div className="space-y-6 animate-fade-in-up">
              
              {/* 1. ENCABEZADO DE RECOMENDACIÓN */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-agri-dark text-white p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 opacity-80 mb-1">
                      <Calendar size={16} />
                      <span className="text-xs font-mono uppercase">Recomendación para Hoy: {result.fecha_calculo}</span>
                    </div>
                    <h2 className="text-4xl font-bold flex items-center gap-3">
                      <Droplets className="text-blue-400" size={40} />
                      {result.recomendacion.riego_sugerido_mm} <span className="text-2xl font-normal">mm</span>
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">Lámina neta a reponer</p>
                  </div>
                  
                  {/* Botón de Trazabilidad (Acción Principal) */}
                  <button 
                    onClick={handleConfirmIrrigation}
                    className="bg-white text-agri-dark hover:bg-gray-100 px-6 py-3 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2"
                  >
                    <CheckCircle size={20} className="text-green-600"/>
                    Confirmar Aplicación
                  </button>
                </div>

                {/* 2. CUERPO DEL INFORME */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* LADO A: DATOS DEL CULTIVO */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Diagnóstico Fenológico</h4>
                    
                    <div className="flex gap-4">
                      <div className="flex-1 bg-green-50 p-3 rounded border border-green-100">
                        <p className="text-xs text-green-700 font-bold mb-1">Edad del Cultivo</p>
                        <p className="text-xl font-bold text-gray-800">{result.edad_dias} <span className="text-sm font-normal">días</span></p>
                      </div>
                      <div className="flex-1 bg-green-50 p-3 rounded border border-green-100">
                        <p className="text-xs text-green-700 font-bold mb-1">Coeficiente (Kc)</p>
                        <p className="text-xl font-bold text-gray-800">{result.kc_ajustado}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <p className="text-xs font-bold text-blue-800 mb-1">ETAPA ACTUAL:</p>
                      <p className="text-sm text-blue-900 font-medium">{result.etapa_fenologica}</p>
                    </div>
                  </div>

                  {/* LADO B: BALANCE HÍDRICO (LA RESTA) */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                      <Sun size={14} /> Balance Hídrico Diario
                    </h4>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {/* Fila 1: Demanda */}
                      <div className="flex justify-between items-center mb-3 text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                          🌱 Demanda Bruta (ETc):
                        </span>
                        <span className="font-bold text-blue-600 text-lg">
                          {/* Optional Chaining para seguridad */}
                          {result.requerimiento_hidrico?.etc_demanda_bruta || result.requerimiento_hidrico?.etc_diaria_mm} mm
                        </span>
                      </div>

                      {/* Fila 2: Aporte Lluvia */}
                      <div className="flex justify-between items-center mb-3 text-sm border-b border-gray-300 pb-3">
                        <span className="text-gray-600 flex items-center gap-2">
                          <CloudRain size={16} className="text-blue-400"/> Aporte Lluvia Efectiva:
                        </span>
                        <span className="font-bold text-green-600 text-lg">
                          - {result.variables_ambientales?.lluvia_efectiva_mm || 0} mm
                        </span>
                      </div>

                      {/* Fila 3: Total */}
                      <div className="flex justify-between items-center text-base font-bold bg-white p-2 rounded border border-gray-100 shadow-sm">
                        <span className="text-gray-800">Riego Neto Requerido:</span>
                        <span className={`text-xl ${result.recomendacion.riego_sugerido_mm > 0 ? 'text-red-500' : 'text-green-600'}`}>
                          {result.recomendacion.riego_sugerido_mm} mm
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-right text-gray-400">
                      Fuente Climática: {result.clima.fuente} (ETo: {result.clima.eto_ayer})
                    </p>
                  </div>
                </div>

                {/* MENSAJE DE CONSEJO */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-start gap-3">
                  <div className="bg-yellow-100 p-2 rounded-full text-yellow-600 mt-1">
                    <History size={16} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-gray-700">Consejo Agronómico</h5>
                    <p className="text-sm text-gray-600 italic">"{result.recomendacion.mensaje}"</p>
                  </div>
                </div>
              </div>

              {/* 3. GRÁFICA CROPWAT (VISUALIZACIÓN AVANZADA) */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <div className="mb-4">
                  <h3 className="font-bold text-gray-700 text-lg">Evolución de Humedad del Suelo</h3>
                  <p className="text-xs text-gray-400">Comportamiento histórico (últimos 30 días) vs. Umbrales de estrés.</p>
                </div>
                
                {chartData.length > 0 ? (
                  <IrrigationChart data={chartData} />
                ) : (
                  <div className="h-[300px] flex justify-center items-center bg-gray-50 rounded border border-dashed text-gray-400 text-sm">
                    No hay suficientes datos históricos para generar la curva de agotamiento.
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}