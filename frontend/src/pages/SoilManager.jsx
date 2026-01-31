import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Layers, Plus, Droplets, Trash2, Save, Edit3 } from 'lucide-react';

export default function SoilManager() {
  const [soils, setSoils] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Estado para edición
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    textura: '',
    capacidad_campo: '',      
    punto_marchitez: '',      
    densidad_aparente: '1.2',
    tasa_max_infiltracion: '',
    profundidad_radicular_max: '1.5'
  });

  const texturePresets = {
    'Arenoso': { cc: 10, pmp: 5, da: 1.6, inf: 30 },
    'Franco-Arenoso': { cc: 15, pmp: 7, da: 1.5, inf: 20 },
    'Franco': { cc: 25, pmp: 12, da: 1.4, inf: 15 },
    'Franco-Arcilloso': { cc: 32, pmp: 18, da: 1.3, inf: 10 },
    'Arcilloso': { cc: 40, pmp: 25, da: 1.2, inf: 5 },
    'Arcilla-Pesada': { cc: 50, pmp: 35, da: 1.1, inf: 1 },
  };

  useEffect(() => {
    fetchSoils();
  }, []);

  const fetchSoils = async () => {
    try {
      const res = await api.get('/suelo/soils/'); 
      setSoils(res.data);
    } catch (error) {
      if (error.response?.status !== 404) toast.error('Error cargando suelos');
    } finally {
      setLoading(false);
    }
  };

  // 🟢 FUNCIÓN PARA CARGAR DATOS EN EL FORMULARIO (MODO EDICIÓN)
  const handleEdit = (soil) => {
      setFormData({
          nombre: soil.nombre,
          textura: soil.textura,
          capacidad_campo: soil.capacidad_campo,
          punto_marchitez: soil.punto_marchitez,
          densidad_aparente: soil.densidad_aparente,
          tasa_max_infiltracion: soil.tasa_max_infiltracion,
          profundidad_radicular_max: soil.profundidad_radicular_max
      });
      setEditingId(soil.id);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Subir para ver el form
  };

  const handleTextureChange = (e) => {
    const type = e.target.value;
    const preset = texturePresets[type];
    setFormData(prev => ({
      ...prev,
      textura: type,
      capacidad_campo: preset ? preset.cc : prev.capacidad_campo,
      punto_marchitez: preset ? preset.pmp : prev.punto_marchitez,
      densidad_aparente: preset ? preset.da : prev.densidad_aparente,
      tasa_max_infiltracion: preset ? preset.inf : prev.tasa_max_infiltracion,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cc = parseFloat(formData.capacidad_campo);
      const pmp = parseFloat(formData.punto_marchitez);
      const humedadDisponible = (cc - pmp).toFixed(2);

      const payload = {
        nombre: formData.nombre,
        textura: formData.textura,
        capacidad_campo: cc,
        punto_marchitez: pmp,
        densidad_aparente: parseFloat(formData.densidad_aparente),
        humedad_disponible: parseFloat(humedadDisponible),
        tasa_max_infiltracion: parseFloat(formData.tasa_max_infiltracion),
        profundidad_radicular_max: parseFloat(formData.profundidad_radicular_max)
      };

      if (editingId) {
          // MODO ACTUALIZAR (PUT)
          await api.patch(`/suelo/soils/${editingId}/`, payload);
          toast.success('Suelo actualizado correctamente');
      } else {
          // MODO CREAR (POST)
          await api.post('/suelo/soils/', payload);
          toast.success('Suelo registrado correctamente');
      }

      setShowForm(false);
      setEditingId(null); // Limpiar modo edición
      setFormData({ 
        nombre: '', textura: '', capacidad_campo: '', punto_marchitez: '', 
        densidad_aparente: '1.2', tasa_max_infiltracion: '', profundidad_radicular_max: '1.5' 
      });
      fetchSoils(); 
    } catch (error) {
      toast.error('Error al guardar el suelo.');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("¿Seguro que deseas eliminar este suelo?")) return;
    try {
      await api.delete(`/suelo/soils/${id}/`);
      toast.success("Suelo eliminado");
      fetchSoils();
    } catch (error) {
      toast.error("No se pudo eliminar");
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Cargando gestión de suelos...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-agri-dark flex items-center gap-2">
            <Layers className="text-amber-700" size={32} />
            Gestión de Suelos
          </h1>
          <p className="text-gray-500">Configura las propiedades hidrodinámicas.</p>
        </div>
        <button 
          onClick={() => {
              setShowForm(!showForm);
              setEditingId(null); // Si abre nuevo, limpia edición
              setFormData({ nombre: '', textura: '', capacidad_campo: '', punto_marchitez: '', densidad_aparente: '1.2', tasa_max_infiltracion: '', profundidad_radicular_max: '1.5' });
          }}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 shadow-sm font-bold"
        >
          {showForm ? 'Cancelar' : <><Plus size={20} /> Nuevo Suelo</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-amber-100 mb-8 animate-fade-in-down">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">
              {editingId ? 'Editar Suelo' : 'Registrar Nuevo Suelo'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Form Fields (Igual que antes) */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                <input type="text" required placeholder="Ej: Lote Sur" className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Textura</label>
                <select className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-amber-500 outline-none" value={formData.textura} onChange={handleTextureChange} required>
                  <option value="">-- Seleccionar --</option>
                  {Object.keys(texturePresets).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Profundidad Suelo (m)</label>
                <input type="number" step="0.1" required className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" value={formData.profundidad_radicular_max} onChange={e => setFormData({...formData, profundidad_radicular_max: e.target.value})} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Capacidad Campo (CC)</label>
                <input type="number" step="0.1" required className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" value={formData.capacidad_campo} onChange={e => setFormData({...formData, capacidad_campo: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Punto Marchitez (PMP)</label>
                <input type="number" step="0.1" required className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" value={formData.punto_marchitez} onChange={e => setFormData({...formData, punto_marchitez: e.target.value})} />
              </div>
            </div>

            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Densidad (Da)</label>
                <input type="number" step="0.01" required className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" value={formData.densidad_aparente} onChange={e => setFormData({...formData, densidad_aparente: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Infiltración (mm/h)</label>
                <input type="number" step="0.1" required className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" value={formData.tasa_max_infiltracion} onChange={e => setFormData({...formData, tasa_max_infiltracion: e.target.value})} />
              </div>
              
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded shadow transition-colors flex justify-center items-center gap-2 mt-4">
                <Save size={18} /> {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTA DE SUELOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {soils.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p>No has registrado ningún tipo de suelo aún.</p>
          </div>
        )}

        {soils.map((soil) => (
          <div key={soil.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-all">
            <div className="bg-amber-50 p-4 border-b border-amber-100 flex justify-between items-center">
              <h3 className="font-bold text-amber-900 truncate">{soil.nombre}</h3>
              <span className="text-xs bg-white text-amber-800 px-2 py-1 rounded border border-amber-200 font-medium whitespace-nowrap">
                {soil.textura}
              </span>
            </div>
            
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-full text-blue-500"><Droplets size={24} /></div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Agua Útil</p>
                  <p className="text-xl font-bold text-gray-800">
                    {soil.humedad_disponible || (soil.capacidad_campo - soil.punto_marchitez).toFixed(1)} 
                    <span className="text-xs text-gray-400 font-normal"> %</span>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3 border-gray-100">
                <div className="flex justify-between"><span className="text-gray-500">Infiltración:</span><span className="font-medium">{soil.tasa_max_infiltracion} mm/h</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Profundidad:</span><span className="font-medium">{soil.profundidad_radicular_max} m</span></div>
              </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
              {/* 🟢 BOTÓN EDITAR */}
              <button 
                onClick={() => handleEdit(soil)}
                className="text-gray-500 hover:text-amber-700 text-sm font-medium flex items-center gap-1 transition-colors"
              >
                <Edit3 size={16} /> Editar
              </button>

              <button onClick={() => handleDelete(soil.id)} className="text-red-400 hover:text-red-600 text-sm font-medium flex items-center gap-1 transition-colors">
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}