// src/sections/auth/AuthLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Grid, Stack, TextField, Typography, CircularProgress } from '@mui/material';
import { useUser } from '../../contexts/UserContext';
import OTPModal from '../../components/OTPModal';

const AuthLogin = () => {
  const navigate = useNavigate();
  const { login } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setOtpError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_URL_BACKEND_API}usuarios/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        setOtpOpen(true);
      } else {
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError('Error en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp) => {
    setLoading(true);
    setOtpError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_URL_BACKEND_API}usuarios/api/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, email })
      });

      const data = await res.json();
      if (res.ok && data.data.access_token && data.data.user) {
        setOtpSuccess(true);
        setTimeout(() => {
          login(data.data.access_token, data.data.user);
          setOtpOpen(false);
          navigate('/');
        }, 1500);
      } else {
        setOtpError(data.message || 'Código incorrecto');
      }
    } catch (err) {
      console.error('Error al verificar OTP:', err);
      setOtpError('Error en el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Stack spacing={2}>
            <TextField label="Correo electrónico" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField label="Contraseña" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <Typography color="error">{error}</Typography>}
            <Button variant="contained" onClick={handleLogin} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Iniciar sesión'}
            </Button>
          </Stack>
        </Grid>
      </Grid>

      <OTPModal
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        onVerify={handleVerifyOTP}
        loading={loading}
        error={otpError}
        success={otpSuccess}
        email={email}
      />
    </>
  );
};

export default AuthLogin;
