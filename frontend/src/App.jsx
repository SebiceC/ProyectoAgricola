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
import PrecipitationManager from './pages/PrecipitationManager';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword'; 
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import CropManager from './pages/CropManager';

// components
import SessionExpiredModal from './components/SessionExpiredModal';

// Protección de Rutas
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando...</div>; 
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        
        {/* 🟢 CORRECCIÓN 1: Agregar el Modal aquí para que exista en la app */}
        <SessionExpiredModal />

        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 🟢 NUEVAS RUTAS DE RECUPERACIÓN */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Esta es la ruta a la que llegará el link del correo */}
          <Route path="/password/reset/confirm/:uid/:token" element={<ResetPassword />} />
          
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
            <Route path="cultivos-base" element={<CropManager />} />
            <Route path="suelos" element={<SoilManager />} />
            <Route path="clima" element={<ClimateEto />} />
            <Route path="lluvia" element={<PrecipitationManager />} />
            <Route path="riego" element={<IrrigationProgramming />} />
            <Route path="mi-perfil" element={<Profile />} />
            {/* 🟢 CORRECCIÓN 2: Registrar la ruta de Configuración */}
            
            <Route path="settings" element={<Settings />} />

          </Route>

          {/* Redirecciones por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch-all: Si la ruta no existe, manda al login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;