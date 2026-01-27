import { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Stack
} from '@mui/material';

const EditRoleModal = ({ open, handleClose, role, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    permisos: ''
  });

  const [isDisabled, setIsDisabled] = useState(true);

  // 🚀 Cargar datos cuando se abre el modal
  useEffect(() => {
    if (role) {
      setFormData({ nombre: role.nombre_rol, descripcion: role.descripcion_rol, permisos: role.permisos_rol });

    }
  }, [role]);

  // 🚀 Validación de campos
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 🚀 Activar o desactivar el botón
  const handleValidation = () => {
    setIsDisabled(!formData.nombre);
  };

  // 🚀 Función para actualizar el rol
  const handleSubmit = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_URL_BACKEND_API}roles/${role.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Rol actualizado correctamente');
        onSave();
        handleClose();
      } else {
        alert('Error al actualizar el rol');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{ p: 4, backgroundColor: 'white', margin: 'auto', width: 400, mt: 10 }}>
        <Typography variant="h6">Editar Rol</Typography>
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
            Guardar Cambios
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};

export default EditRoleModal;
