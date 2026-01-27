import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importación de Vistas
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import NewPlanting from './pages/NewPlanting';
import SoilManager from './pages/SoilManager';
import MyCrops from './pages/MyCrops'; 
import ClimateEto from './pages/ClimateEto';
import IrrigationProgramming from './pages/IrrigationProgramming';


// Protección de Rutas
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando...</div>; // Evita parpadeos
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* RUTAS PROTEGIDAS (Layout Principal) */}
          <Route path="/home" element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }>
            {/* Index: La vista Home con tarjetas */}
            <Route index element={<Home />} />
            
            {/* Sub-rutas funcionales */}
            <Route path="mis-cultivos" element={<MyCrops />} />
            <Route path="nuevo-cultivo" element={<NewPlanting />} />
            <Route path="suelos" element={<SoilManager />} />
            
            {/* Placeholders para futuras implementaciones */}
            <Route path="clima" element={<ClimateEto />} />
            <Route path="lluvia" element={<div>Próximamente: Lluvias</div>} />
            <Route path="riego" element={<IrrigationProgramming />} />
          </Route>

          {/* Redirecciones por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<Navigate to="/home" replace />} /> {/* Retro-compatibilidad */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;