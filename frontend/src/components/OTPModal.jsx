// src/components/OTPModal.jsx
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, CircularProgress, Alert } from '@mui/material';

const OTPModal = ({ open, onClose, onVerify, loading, error, success, email }) => {
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    if (code.length === 6) {
      onVerify(code);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Verificación de código OTP</DialogTitle>
      <DialogContent>
        <Typography mb={2}>
          Hemos enviado un código a <b>{email}</b>. Por favor ingrésalo para continuar.
        </Typography>
        <TextField label="Código OTP" fullWidth value={code} onChange={(e) => setCode(e.target.value)} inputProps={{ maxLength: 6 }} />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Código verificado. Redirigiendo...
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || code.length !== 6}>
          {loading ? <CircularProgress size={24} /> : 'Verificar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OTPModal;
