import { ResponsiveContainer, ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';

export default function IrrigationChart({ data }) {
  if (!data || data.length === 0) return <div className="p-4 text-center text-gray-400">Sin datos históricos suficientes.</div>;

  // Calculamos límites para que la gráfica se vea centrada
  const maxVal = Math.max(...data.map(d => d.field_capacity)) * 1.2;
  const minVal = Math.min(...data.map(d => d.wilting_point)) * 0.8;

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-gray-700 font-bold mb-4 flex items-center gap-2">
        📉 Balance Hídrico del Suelo 
      </h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{fontSize: 10}} 
            tickFormatter={(str) => str.slice(5)} // Muestra solo MM-DD
          />
          <YAxis domain={[minVal, maxVal]} label={{ value: 'Humedad (mm)', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Legend />

          {/* 1. ZONA DE ESTRÉS (Rojo) - Desde PMP hasta Umbral Crítico */}
          {/* Truco: Usamos Area apilada o referencias, aquí usaremos ReferenceArea o rellenos simples */}
          
          {/* Línea de Capacidad de Campo (Tanque Lleno) */}
          <Line type="monotone" dataKey="field_capacity" stroke="#10b981" strokeWidth={2} dot={false} name="Capacidad Campo" />
          
          {/* Línea de Umbral Crítico (Inicio de Estrés) */}
          <Line type="monotone" dataKey="critical_point" stroke="#f59e0b" strokeDasharray="5 5" dot={false} name="Umbral Riego" />

          {/* Línea de Punto de Marchitez (Muerte) */}
          <Line type="monotone" dataKey="wilting_point" stroke="#ef4444" strokeWidth={2} dot={false} name="Punto Marchitez" />

          {/* 2. NIVEL ACTUAL DE AGUA (La variable más importante) */}
          <Area 
            type="monotone" 
            dataKey="water_level" 
            fill="#3b82f6" 
            fillOpacity={0.3} 
            stroke="#2563eb" 
            strokeWidth={3}
            name="Humedad Actual"
          />

          {/* 3. EVENTOS (Barras desde abajo) */}
          <Bar dataKey="rain" barSize={10} fill="#0ea5e9" name="Lluvia" stackId="a" />
          <Bar dataKey="irrigation" barSize={10} fill="#22c55e" name="Riego" stackId="a" />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}