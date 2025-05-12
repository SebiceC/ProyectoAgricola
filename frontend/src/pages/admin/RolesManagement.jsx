import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button
} from '@mui/material';
import CreateRoleModal from './components/CreateRoleModal';
import EditRoleModal from './components/EditRoleModal';



const RolesManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const URL = import.meta.env.VITE_URL_BACKEND_API + 'roles';
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const handleOpenCreate = () => setOpenCreateModal(true);
  const handleCloseCreate = () => setOpenCreateModal(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);

    const handleOpenEdit = (role) => {
        setSelectedRole(role);
        setOpenEditModal(true);
    };

    const handleCloseEdit = () => {
        setOpenEditModal(false);
        setSelectedRole(null);
    };



  // 🚀 Función para traer los roles del backend
  const fetchRoles = async () => {
    try {
      const response = await fetch(URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setRoles(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm('¿Estás seguro de eliminar este rol?')) {
        try {
        const response = await fetch(`${import.meta.env.VITE_URL_BACKEND_API}roles/${roleId}`, {
            method: 'DELETE',
            headers: {
            'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert('Rol eliminado correctamente');
            fetchRoles(); // Actualiza la tabla
        } else {
            alert('Error al eliminar el rol');
        }
        } catch (error) {
        console.error('Error eliminando el rol:', error);
        alert('Error eliminando el rol');
        }
    }
  };


  useEffect(() => {
    fetchRoles();
  }, []);

  if (loading) {
    return <Typography variant="h5">Loading roles...</Typography>;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5">Roles Management</Typography>
        <Button
            variant="contained"
            color="primary"
            sx={{ mb: 2 }}
            onClick={handleOpenCreate}
        >
            Crear Rol
        </Button>

        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Role Name</TableCell>
                <TableCell>Role Name</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.nombre_rol}>
                  <TableCell>{role.nombre_rol}</TableCell>
                  <TableCell>{role.descripcion_rol}</TableCell>
                  <TableCell>{role.permisos_rol}</TableCell>
                  <TableCell>
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => handleOpenEdit(role)}
                    >
                        Editar
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteRole(role.nombre_rol)}
                    >
                        Eliminar
                    </Button>

                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <CreateRoleModal
            open={openCreateModal}
            handleClose={handleCloseCreate}
            onSave={fetchRoles}
        />
        <EditRoleModal
            open={openEditModal}
            handleClose={handleCloseEdit}
            role={selectedRole}
            onSave={fetchRoles}
        />
      </CardContent>
    </Card>
  );
};

export default RolesManagement;
