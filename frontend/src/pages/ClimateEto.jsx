import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { CloudSun, MapPin, Calendar, Activity, ArrowRight, Info } from 'lucide-react';

export default function ClimateEto() {
  // Estado para los métodos (fórmulas) disponibles
  const [methods, setMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  
  // Estado del resultado
  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Formulario
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    altitude: 0,
    start_date: '',
    end_date: '',
    method: '' // Se llenará con el primero disponible
  });

  // 1. Cargar métodos disponibles al iniciar
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        // Consultamos al backend qué fórmulas soporta
        const res = await api.get('/available-methods/');
        console.log("📦 MÉTODOS RECIBIDOS:", res.data); // <--- Agrega esto
        // console.log("Tipo de dato:", typeof res.data.methods[0]);
        const methodList = res.data.methods; // Guardamos la lista
        
        setMethods(res.data.methods);
        
        if (methodList.length > 0) {
            // Buscamos si existe Penman, si no, usamos el primero de la lista
            const defaultMethod = methodList.find(m => m.key === 'penman-monteith') 
                ? 'penman-monteith' 
                : methodList[0].key;

            setFormData(prev => ({
                ...prev,
                method: defaultMethod
            }));
        }
      } catch (error) {
        console.error(error);
        toast.error('No se pudieron cargar los métodos de cálculo');
      } finally {
        setLoadingMethods(false);
      }
    };
    fetchMethods();
  }, []);

  // 2. Manejar el cálculo
  const handleCalculate = async (e) => {
    e.preventDefault();
    setCalculating(true);
    setResult(null); // Limpiar resultado anterior

    try {
      // Endpoint que conecta con NASA POWER
      const response = await api.post('/calculate-eto/', {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        altitude: parseFloat(formData.altitude),
        start_date: formData.start_date,
        end_date: formData.end_date,
        method: formData.method
      });

      if (response.data.success) {
        setResult(response.data);
        toast.success(`ETo calculada con ${formData.method}`);
      } else {
        toast.error('La API respondió pero sin éxito.');
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'Error conectando con el servicio climático';
      toast.error(msg);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-agri-dark flex items-center gap-2">
          <CloudSun size={32} className="text-blue-500" />
          Cálculo de Evapotranspiración (ETo)
        </h1>
        <p className="text-gray-500">
          Conexión satelital con NASA POWER para estimar la demanda hídrica.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <form onSubmit={handleCalculate} className="space-y-5">
            
            {/* UBICACIÓN */}
            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-1 mb-2">
                <MapPin size={16} /> Ubicación
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number" step="0.0001" placeholder="Latitud"
                    className="w-full p-2 border rounded text-sm"
                    value={formData.latitude}
                    onChange={e => setFormData({...formData, latitude: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <input
                    type="number" step="0.0001" placeholder="Longitud"
                    className="w-full p-2 border rounded text-sm"
                    value={formData.longitude}
                    onChange={e => setFormData({...formData, longitude: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="mt-2">
                <input
                    type="number" step="1" placeholder="Altitud (msnm)"
                    className="w-full p-2 border rounded text-sm"
                    value={formData.altitude}
                    onChange={e => setFormData({...formData, altitude: e.target.value})}
                  />
              </div>
              <p className="text-xs text-gray-400 mt-1">Ej: Neiva (Lat: 2.92, Lon: -75.28)</p>
            </div>

            {/* FECHAS */}
            <div>
                <label className="text-sm font-bold text-gray-700 flex items-center gap-1 mb-2">
                    <Calendar size={16} /> Periodo de Análisis
                </label>
                
                <div className="grid grid-cols-2 gap-4">
                    {/* FECHA INICIAL */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Fecha Inicial</label>
                        <input
                            type="date"
                            className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.start_date}
                            onChange={e => setFormData({...formData, start_date: e.target.value})}
                            required
                        />
                    </div>

                    {/* FECHA FINAL */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Fecha Final</label>
                        <input
                            type="date"
                            className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.end_date}
                            onChange={e => setFormData({...formData, end_date: e.target.value})}
                            required
                        />
                    </div>
                </div>
                
                <p className="text-xs text-blue-400 mt-2 bg-blue-50 p-2 rounded">
                    ℹ️ <strong>Nota:</strong> Usa fechas con al menos 1 mes de antigüedad para asegurar datos satelitales completos.
                </p>
            </div>

            {/* MÉTODO (Dinámico del Backend) */}
            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-1 mb-2">
                <Activity size={16} /> Fórmula Matemática
              </label>
              {loadingMethods ? (
                <div className="text-xs text-gray-500 animate-pulse">Cargando fórmulas...</div>
              ) : (
                <select
                    className="w-full p-2 border rounded text-sm bg-white"
                    value={formData.method}
                    onChange={e => setFormData({...formData, method: e.target.value})}
                >
                    {methods.map((m) => (
                        <option key={m.key} value={m.key}>
                            {m.name} 
                        </option>
                    ))}
                </select>
              )}
            </div>

            <button
              type="submit"
              disabled={calculating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors flex justify-center items-center gap-2"
            >
              {calculating ? 'Consultando NASA...' : <>Calcular <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        {/* COLUMNA DERECHA: RESULTADOS */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
              <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center">
                <h3 className="font-bold text-blue-800">Reporte de ETo Diaria</h3>
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full uppercase font-bold">
                  {result.method}
                </span>
              </div>
              
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-2">Evapotranspiración de Referencia Promedio</p>
                <div className="text-6xl font-extrabold text-agri-dark mb-2">
                  {result.eto.toFixed(2)} <span className="text-2xl text-gray-400 font-normal">mm/día</span>
                </div>
                <div className="flex justify-center gap-4 text-sm text-gray-500 mt-6 bg-gray-50 p-4 rounded-lg inline-flex">
                   <div>
                      <span className="block font-bold text-gray-700">Periodo</span>
                      {result.period}
                   </div>
                   <div className="border-l border-gray-300 mx-2"></div>
                   <div>
                      <span className="block font-bold text-gray-700">Coordenadas</span>
                      {result.coordinates}
                   </div>
                </div>

                {result.observations && (
                  <div className="mt-6 text-left bg-yellow-50 p-4 rounded border border-yellow-100 flex gap-2">
                    <Info className="text-yellow-600 flex-shrink-0" size={20}/>
                    <p className="text-sm text-yellow-800">{result.observations}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // ESTADO VACÍO (Placeholder)
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 p-10 text-gray-400">
              <CloudSun size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Esperando datos...</p>
              <p className="text-sm text-center max-w-xs mt-2">
                Selecciona una ubicación y un rango de fechas para descargar datos meteorológicos.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}