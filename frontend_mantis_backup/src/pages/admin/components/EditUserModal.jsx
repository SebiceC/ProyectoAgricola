import { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Select,
  MenuItem
} from '@mui/material';

const EditUserModal = ({ open, handleClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    rol: ''
  });

  const [roles, setRoles] = useState([]);
  const [isDisabled, setIsDisabled] = useState(true);

  // 🚀 Función para cargar los roles desde el backend
  const fetchRoles = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_URL_BACKEND_API}roles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data); // Aquí asignamos los roles disponibles
      } else {
        console.error('Error al traer los roles');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // 🚀 Precargar datos en el modal
  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre_usuario || '',
        apellido: user.apellido_usuario || '',
        email: user.email_usuario || '',
        rol: user.rol_id || ''
      });
    }
  }, [user]);

  // 🚀 Validación de campos
  useEffect(() => {
    const { nombre, apellido, email, rol } = formData;
    if (nombre && apellido && email && rol) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [formData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_URL_BACKEND_API}usuarios/${user.id_usuario}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Usuario actualizado correctamente');
        onSave();
        handleClose();
      } else {
        alert('Error al actualizar el usuario');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{ p: 4, backgroundColor: 'white', margin: 'auto', width: 400, mt: 10 }}>
        <Typography variant="h6">Editar Usuario</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="First Name"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            error={!formData.nombre}
            helperText={!formData.nombre ? 'This field is required' : ''}
          />
          <TextField
            label="Last Name"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
            error={!formData.apellido}
            helperText={!formData.apellido ? 'This field is required' : ''}
          />
          <TextField
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={!formData.email}
            helperText={!formData.email ? 'This field is required' : ''}
          />
          
          <Select
            label="Role"
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            fullWidth
            error={!formData.rol}
          >
            {roles.map((role) => (
              <MenuItem key={role.nombre_rol} value={role.nombre_rol}>
                {role.nombre_rol}
              </MenuItem>
            ))}
          </Select>

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

export default EditUserModal;
