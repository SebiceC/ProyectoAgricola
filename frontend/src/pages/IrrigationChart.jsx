import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  ResponsiveContainer, ComposedChart, Line, Area, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

export default function IrrigationChart({ plantingId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (plantingId) {
        setLoading(true);
        // Agregamos un timestamp para evitar caché agresivo del navegador
        api.get(`/cultivo/plantings/${plantingId}/water_balance_history/?t=${new Date().getTime()}`)
           .then(res => setData(res.data))
           .catch(err => console.error(err))
           .finally(() => setLoading(false));
    }
  }, [plantingId]);

  if (loading) return <div className="w-full h-full bg-gray-50 animate-pulse rounded-xl"></div>;
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">Sin datos históricos.</div>;

  return (
    <div className="w-full h-full bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
      <h3 className="text-gray-700 font-bold mb-2 flex items-center gap-2 text-sm">
        📉 Balance Hídrico (30 Días)
      </h3>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            
            <XAxis 
              dataKey="date" 
              tick={{fontSize: 10}} 
              tickFormatter={(str) => str ? str.slice(5) : ''} 
              interval="preserveStartEnd" // 🟢 IMPORTANTE: Fuerza mostrar el primer y último día
              minTickGap={10} // Evita que se amontonen si hay muchos días
            />
            
            <YAxis domain={[0, 'auto']} tick={{fontSize: 10}} />
            
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>

            {/* Líneas de Referencia */}
            <Line type="monotone" dataKey="field_capacity" stroke="#10b981" strokeWidth={2} dot={false} name="Cap. Campo" />
            <Line type="monotone" dataKey="critical_point" stroke="#f59e0b" strokeDasharray="5 5" dot={false} name="Umbral Riego" />
            <Line type="monotone" dataKey="wilting_point" stroke="#ef4444" strokeWidth={2} dot={false} name="Pto. Marchitez" />

            {/* Área de Agua Actual */}
            <Area 
              type="monotone" 
              dataKey="water_level" 
              fill="#3b82f6" 
              fillOpacity={0.3} 
              stroke="#2563eb" 
              strokeWidth={3}
              name="Humedad Actual"
              activeDot={{ r: 6 }}
            />

            {/* 🟢 BARRAS SEPARADAS (Sin stackId) */}
            {/* La lluvia en Azul claro */}
            <Bar dataKey="rain" barSize={8} fill="#0ea5e9" name="Lluvia" radius={[4, 4, 0, 0]} />
            
            {/* El riego en Verde Intenso (Separado para que no se oculten) */}
            <Bar dataKey="irrigation" barSize={8} fill="#16a34a" name="Riego Aplicado" radius={[4, 4, 0, 0]} />

          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}