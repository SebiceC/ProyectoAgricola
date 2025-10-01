import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Grid, Stack, TextField, Typography, CircularProgress } from '@mui/material';
import { useUser } from '../../contexts/UserContext';

const AuthLogin = () => {
  const navigate = useNavigate();
  const { login } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_URL_BACKEND_API}api/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok && data.token && data.email) {
        login(data.token, { id: data.user_id, email: data.email });
        navigate('/');
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

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Stack spacing={2}>
          <TextField 
            label="Correo electrónico" 
            fullWidth 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <TextField 
            label="Contraseña" 
            type="password" 
            fullWidth 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          {error && <Typography color="error">{error}</Typography>}
          <Button variant="contained" onClick={handleLogin} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Iniciar sesión'}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
};

export default AuthLogin;