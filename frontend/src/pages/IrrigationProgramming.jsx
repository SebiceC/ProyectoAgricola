import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { 
  Droplets, Sprout, Wind, AlertTriangle, CheckCircle, 
  Info, Calculator, Save, X, ArrowRight
} from 'lucide-react';

import IrrigationChart from './IrrigationChart';
// 🟢 IMPORT: Usamos la utilidad centralizada de fechas
import { toStandardDate } from '../utils/dateUtils';

export default function IrrigationProgramming() {
  const [plantings, setPlantings] = useState([]);
  const [calculations, setCalculations] = useState({});
  const [calculating, setCalculating] = useState({});
  
  const [confirmModal, setConfirmModal] = useState({ open: false, plantId: null, suggestedMm: 0 });
  const [realIrrigation, setRealIrrigation] = useState('');

  useEffect(() => {
    loadPlantings();
  }, []);

  const loadPlantings = async () => {
    try {
      const res = await api.get('/cultivo/plantings/');
      setPlantings(res.data);
    } catch (error) { console.error(error); }
  };

  const handleCalculate = async (plantingId) => {
    setCalculating(prev => ({ ...prev, [plantingId]: true }));
    try {
      const res = await api.get(`/cultivo/plantings/${plantingId}/calculate_irrigation/`);
      setCalculations(prev => ({ ...prev, [plantingId]: res.data }));
      toast.success("Balance hídrico actualizado correctamente");
    } catch (error) {
      console.error("Error de cálculo:", error);

      if (error.response) {
          const { status, data } = error.response;

          // 🛑 CASO 1: VALIDACIÓN ESTRICTA (Faltan datos diarios)
          if (status === 422) {
             toast.custom((t) => (
               <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-amber-500`}>
                 <div className="flex-1 w-0 p-4">
                   <div className="flex items-start">
                     <div className="flex-shrink-0 pt-0.5">
                       <AlertTriangle className="h-10 w-10 text-amber-500" />
                     </div>
                     <div className="ml-3 flex-1">
                       <p className="text-sm font-bold text-gray-900">
                         {data.error || "Datos Incompletos"}
                       </p>
                       <p className="mt-1 text-sm text-gray-500">
                         {data.message}
                       </p>
                       {data.solution && (
                           <div className="mt-2 text-xs bg-amber-50 text-amber-800 p-2 rounded border border-amber-100 font-medium">
                               💡 <strong>Acción requerida:</strong> {data.solution}
                           </div>
                       )}
                     </div>
                   </div>
                 </div>
                 <div className="flex border-l border-gray-200">
                   <button
                     onClick={() => toast.dismiss(t.id)}
                     className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-amber-600 hover:text-amber-500 focus:outline-none"
                   >
                     Cerrar
                   </button>
                 </div>
               </div>
             ), { duration: 6000 });
             return; 
          }

          // 🛑 CASO 2: ERROR ESTRUCTURAL (Falta Suelo o Estación)
          if (status === 400) {
              toast.error(data.message || "Falta configuración previa (Suelo o Estación).");
              return;
          }

          // OTROS ERRORES
          toast.error(data.message || "Error interno del servidor.");
      } else {
          toast.error("Error de conexión. Verifique su red.");
      }
    } finally {
      setCalculating(prev => ({ ...prev, [plantingId]: false }));
    }
  };

  const openConfirmModal = (plantId, suggested) => {
      setConfirmModal({ open: true, plantId, suggestedMm: suggested });
      setRealIrrigation(suggested);
  };

  const handleSaveIrrigation = async () => {
      if (!realIrrigation || realIrrigation <= 0) return toast.error("Ingresa una cantidad válida");
      
      try {
          await api.post('/cultivo/executions/', {
              planting: confirmModal.plantId,
              water_volume_mm: parseFloat(realIrrigation),
              // 🟢 AJUSTE DE FECHA: Enviamos DD/MM/YYYY al backend
              date: toStandardDate(new Date()) 
          });
          toast.success("Riego registrado exitosamente.");
          setConfirmModal({ open: false, plantId: null, suggestedMm: 0 });
          // Recalcular automáticamente para ver el nuevo balance
          handleCalculate(confirmModal.plantId);
      } catch (error) {
          console.error(error);
          toast.error("Error guardando el riego.");
      }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-agri-dark flex items-center gap-3">
          <Droplets className="text-blue-600" size={36} />
          Programación de Riego
        </h1>
        <p className="text-gray-500 mt-2">Recomendaciones diarias basadas en balance hídrico.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {plantings.map((plant) => {
          const result = calculations[plant.id];
          const isCalculating = calculating[plant.id];

          return (
            <div key={plant.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              
              <div className="p-6 border-b bg-gray-50 flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full text-agri-green"><Sprout size={24} /></div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">
                            {plant.crop_details?.nombre || "Cultivo #" + plant.id}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                             {/* 🟢 AJUSTE VISUAL: Aseguramos formato estándar */}
                             Sembrado: {toStandardDate(plant.fecha_siembra)} 
                             <span className="text-gray-300">|</span> 
                             {plant.soil?.nombre || <span className="text-red-400 font-bold flex items-center gap-1"><AlertTriangle size={12}/> Sin Suelo</span>}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => handleCalculate(plant.id)}
                    disabled={isCalculating}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
                >
                    {isCalculating ? <span className="animate-spin">⏳</span> : <Calculator size={18} />}
                    {result ? 'Recalcular' : 'Calcular Riego'}
                </button>
              </div>

              {result && (
                <div className="p-6 animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {/* Tarjeta Principal */}
                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 text-center flex flex-col justify-center items-center relative shadow-sm">
                            <h4 className="text-sm font-bold text-blue-800 uppercase mb-2">Riego Sugerido (Bruto)</h4>
                            <div className="flex items-baseline gap-1 my-2">
                                <span className="text-5xl font-black text-blue-700">{result.recomendacion.riego_sugerido_mm}</span>
                                <span className="text-xl font-medium text-blue-500">mm</span>
                            </div>
                            
                            {result.recomendacion.riego_sugerido_mm > 0 ? (
                                <button 
                                    onClick={() => openConfirmModal(plant.id, result.recomendacion.riego_sugerido_mm)}
                                    className="mt-4 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                                >
                                    <CheckCircle size={16}/> Confirmar Aplicación
                                </button>
                            ) : (
                                <span className="text-xs text-blue-400 mt-2 block font-medium bg-white px-2 py-1 rounded-full border border-blue-100">
                                    ✅ No se requiere riego hoy
                                </span>
                            )}
                        </div>

                        {/* Detalles */}
                        <div className="md:col-span-2 space-y-4">
                            <div className={`flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-sm ${
                                result.requerimiento_hidrico.estado.includes('Estrés') ? 'bg-red-50 border-red-500 text-red-800' : 
                                result.requerimiento_hidrico.estado.includes('Normal') ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                                'bg-green-50 border-green-500 text-green-800'
                            }`}>
                                <Info size={24} className="shrink-0 mt-1"/>
                                <div>
                                    <strong className="block font-bold text-lg">{result.requerimiento_hidrico.estado}</strong>
                                    <p className="text-sm opacity-90">{result.recomendacion.mensaje}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                    <span className="text-xs text-gray-500 block mb-1 uppercase font-bold">ETo (Ayer)</span>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-800 text-lg">{result.clima.eto_ayer} mm</p>
                                        
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                            result.clima.fuente.includes('MANUAL') 
                                            ? 'bg-green-100 text-green-700 border-green-200' 
                                            : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                        }`}>
                                            {result.clima.fuente.includes('MANUAL') ? 'MANUAL' : 'AUTO'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                    <span className="text-xs text-gray-500 block mb-1 uppercase font-bold">Eficiencia del Sistema</span>
                                    <p className="font-bold text-gray-800 text-lg">{result.requerimiento_hidrico.eficiencia_sistema}</p>
                                </div>
                            </div>

                            <div className="text-xs text-gray-400 flex items-start gap-2 mt-2 bg-gray-50 p-3 rounded border border-gray-100">
                                <Calculator size={14} className="shrink-0 mt-0.5" />
                                <span>
                                    <strong>Fórmula:</strong> (Déficit Neto <em>{result.requerimiento_hidrico.deficit_acumulado_mm}mm</em>) ÷ 
                                    (Eficiencia <em>{result.requerimiento_hidrico.eficiencia_sistema}</em>) = 
                                    <strong className="text-gray-600"> {result.recomendacion.riego_sugerido_mm} mm</strong> (Lo que debes bombear).
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h4 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2">
                            <Wind size={16}/> Comportamiento Histórico (30 días)
                        </h4>
                        <div className="h-[400px] w-full bg-white rounded-xl border border-gray-100 p-2 shadow-inner">
                            <IrrigationChart plantingId={plant.id} />
                        </div>
                    </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL EMERGENTE CONFIRMACIÓN */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-xl font-bold text-gray-800">Registrar Riego</h3>
                    <button onClick={() => setConfirmModal({...confirmModal, open: false})}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                </div>
                
                <p className="text-gray-600 text-sm mb-6">
                    El sistema sugirió aplicar <strong className="text-blue-600 text-lg">{confirmModal.suggestedMm} mm</strong>. 
                    <br/>Confirma la cantidad real aplicada en campo:
                </p>
                
                <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Lámina Aplicada (mm)</label>
                    <input 
                        type="number" 
                        autoFocus
                        className="w-full border-2 border-gray-200 p-3 rounded-lg font-bold text-2xl text-center text-gray-700 focus:border-green-500 focus:ring-0 outline-none transition-colors"
                        value={realIrrigation}
                        onChange={(e) => setRealIrrigation(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                        className="flex-1 py-3 bg-gray-100 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSaveIrrigation}
                        className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg hover:bg-green-700 transition-colors flex justify-center items-center gap-2"
                    >
                        <Save size={18}/> Guardar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}