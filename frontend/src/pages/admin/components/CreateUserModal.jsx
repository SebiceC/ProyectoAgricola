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

const CreateUserModal = ({ open, handleClose, onSave }) => {
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

  // 🚀 Precargar los roles al abrir el modal
  useEffect(() => {
    fetchRoles();
  }, []);

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
      const response = await fetch(`${import.meta.env.VITE_URL_BACKEND_API}usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Usuario creado correctamente');
        onSave();
        handleClose();
      } else {
        alert('Error al crear el usuario');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{ p: 4, backgroundColor: 'white', margin: 'auto', width: 400, mt: 10 }}>
        <Typography variant="h6">Crear Usuario</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="First Name"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
          />
          <TextField
            label="Last Name"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
          />
          <TextField
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          <Select
            label="Role"
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            fullWidth
          >
            {roles.map((rol) => (
              <MenuItem key={rol.nombre_rol} value={rol.nombre_rol}>
                {rol.nombre_rol}
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isDisabled}
          >
            Crear Usuario
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};

export default CreateUserModal;
