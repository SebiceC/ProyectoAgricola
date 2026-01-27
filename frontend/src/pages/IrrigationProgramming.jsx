import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { 
  Droplets, Sprout, ArrowRight, AlertTriangle, CheckCircle, 
  Leaf, ThermometerSun, Activity, Calendar 
} from 'lucide-react';

export default function IrrigationProgramming() {
  const [plantings, setPlantings] = useState([]);
  const [soils, setSoils] = useState([]);
  const [cropsCatalog, setCropsCatalog] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Estado para selección y cálculo
  const [selectedSoil, setSelectedSoil] = useState({});
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null); // Aquí guardamos la receta de riego

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

  // 🧠 FUNCIÓN NUEVA: LLAMAR AL CEREBRO DE RIEGO
  const handleCalculate = async (plantingId, cropName) => {
    setCalculating(true);
    setResult(null); // Limpiamos resultado anterior

    try {
      // Llamamos al endpoint personalizado que creamos en el backend
      const res = await api.get(`/cultivo/plantings/${plantingId}/calculate_irrigation/`);
      
      // Agregamos el nombre del cultivo al resultado para mostrarlo en el título
      setResult({ ...res.data, cropName });
      
      toast.success("Cálculo realizado con éxito");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo calcular el riego. Verifica la conexión con la NASA.");
    } finally {
      setCalculating(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Cargando motor de riego...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-agri-dark flex items-center gap-2">
          <Droplets className="text-blue-600" size={32} />
          Programación de Riego
        </h1>
        <p className="text-gray-500">
          Balance hídrico diario basado en datos satelitales (NASA POWER).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMNA IZQUIERDA: LISTA DE CULTIVOS */}
        <div className="space-y-6">
          <h2 className="font-bold text-gray-700 border-b pb-2">Tus Siembras Activas</h2>
          
          {plantings.map((plant) => {
            const hasSoil = plant.soil !== null && plant.soil !== undefined;
            const cropTypeName = cropsCatalog[plant.crop] || "Cultivo";
            const plantingName = plant.nombre || `Lote #${plant.id}`;
            const soilName = plant.soil?.nombre || 'Sin Suelo';

            return (
              <div key={plant.id} className={`p-6 rounded-xl border shadow-sm transition-all ${hasSoil ? 'bg-white border-gray-200' : 'bg-orange-50 border-orange-200'}`}>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${hasSoil ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      <Sprout size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{cropTypeName}</h3>
                      <p className="text-sm text-gray-600 font-medium">📍 {plantingName}</p>
                    </div>
                  </div>
                  {hasSoil ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                      <CheckCircle size={12} /> Listo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      <AlertTriangle size={12} /> Falta Suelo
                    </span>
                  )}
                </div>

                {!hasSoil ? (
                  <div className="mt-4 bg-white p-4 rounded-lg border border-orange-100">
                    <p className="text-sm text-gray-600 mb-2 font-medium">⚠️ Selecciona el suelo:</p>
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 p-2 border rounded text-sm bg-gray-50 outline-none"
                        onChange={(e) => setSelectedSoil({...selectedSoil, [plant.id]: e.target.value})}
                        defaultValue=""
                      >
                        <option value="" disabled>-- Elige un Suelo --</option>
                        {soils.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} {s.textura ? `(${s.textura})` : ''}
                          </option>
                        ))}
                      </select>
                      <button 
                        onClick={() => handleAssignSoil(plant.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-1"
                      >
                        Vincular <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <button 
                      onClick={() => handleCalculate(plant.id, cropTypeName)}
                      disabled={calculating}
                      className="w-full py-3 bg-agri-green hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                       {calculating ? 'Conectando con NASA...' : <><Droplets size={20} /> Calcular Riego Hoy</>}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-2">
                      Suelo vinculado: <strong>{soilName}</strong>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* COLUMNA DERECHA: RESULTADOS DEL CÁLCULO */}
        <div className="hidden lg:block sticky top-8 h-fit">
          {!result ? (
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-8 text-center min-h-[400px] flex flex-col justify-center items-center">
              <div className="mb-6 inline-block p-6 bg-blue-100 rounded-full text-blue-500 animate-pulse">
                <Droplets size={64} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Panel de Control de Riego</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Selecciona un cultivo y presiona "Calcular" para obtener la lámina de riego exacta basada en el clima de ayer.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-fade-in-up">
              {/* HEADER RESULTADO */}
              <div className="bg-agri-dark text-white p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold opacity-90">Recomendación de Riego</h3>
                  <span className="bg-white/20 px-2 py-1 rounded text-xs font-mono">
                    {result.fecha_calculo}
                  </span>
                </div>
                <h2 className="text-3xl font-bold flex items-center gap-2">
                  <Droplets className="text-blue-300" />
                  {result.recomendacion.riego_sugerido_mm} mm
                </h2>
                <p className="text-blue-100 text-sm mt-1">Lámina neta a reponer hoy</p>
              </div>

              {/* CUERPO DEL REPORTE */}
              <div className="p-6 space-y-6">
                
                {/* 1. ESTADO DEL CULTIVO */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Estado del Cultivo ({result.cropName})</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                      <div className="flex items-center gap-2 text-green-700 mb-1">
                        <Calendar size={16} /> <span className="text-xs font-bold">Edad</span>
                      </div>
                      <p className="font-bold text-gray-800">{result.edad_dias} días</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                      <div className="flex items-center gap-2 text-green-700 mb-1">
                        <Activity size={16} /> <span className="text-xs font-bold">Etapa</span>
                      </div>
                      <p className="font-bold text-gray-800 text-sm">{result.etapa_fenologica}</p>
                    </div>
                  </div>
                </div>

                {/* 2. VARIABLES CLIMÁTICAS */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Variables del Cálculo</h4>
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">ETo (Clima)</p>
                      <p className="text-xl font-bold text-gray-800">{result.clima.eto_ayer}</p>
                      <p className="text-[10px] text-gray-400">mm/día</p>
                    </div>
                    <div className="text-gray-300">✖</div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Kc (Planta)</p>
                      <p className="text-xl font-bold text-green-600">{result.kc_ajustado}</p>
                      <p className="text-[10px] text-gray-400">Coeficiente</p>
                    </div>
                    <div className="text-gray-300">=</div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">ETc (Demanda)</p>
                      <p className="text-xl font-bold text-blue-600">{result.requerimiento_hidrico.etc_diaria_mm}</p>
                      <p className="text-[10px] text-gray-400">mm/día</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 text-right">
                    Fuente: {result.clima.fuente}
                  </p>
                </div>

                {/* 3. MENSAJE FINAL */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    💡 <strong>Consejo:</strong> {result.recomendacion.mensaje}
                  </p>
                </div>

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}