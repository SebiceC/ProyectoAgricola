import { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Stack
} from '@mui/material';

const CreateRoleModal = ({ open, handleClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    permisos: ''
  });

  const [isDisabled, setIsDisabled] = useState(true);

  // 🚀 Validación de campos
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 🚀 Activar o desactivar el botón
  const handleValidation = () => {
    setIsDisabled(!formData.name);
  };

  // 🚀 Función para crear el rol
  const handleSubmit = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_URL_BACKEND_API}roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Rol creado correctamente');
        onSave();
        handleClose();
      } else {
        alert('Error al crear el rol');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{ p: 4, backgroundColor: 'white', margin: 'auto', width: 400, mt: 10 }}>
        <Typography variant="h6">Crear Rol</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Nombre del Rol"
            name="nombre"
            value={formData.nombre}
            onChange={(e) => {
              handleChange(e);
              handleValidation();
            }}
          />
          <TextField
            label="Descripción del Rol"
            name="descripcion"
            value={formData.descripcion}
            onChange={(e) => {
              handleChange(e);
              handleValidation();
            }}
          />
          <TextField
            label="Permisos"
            name="permisos"
            value={formData.permisos}
            onChange={(e) => {
              handleChange(e);
              handleValidation();
            }}
          />
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isDisabled}
          >
            Crear Rol
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};

export default CreateRoleModal;
