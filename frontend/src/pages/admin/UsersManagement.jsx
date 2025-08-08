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
  Button,
  TextField,
  Stack
} from '@mui/material';
import { useEffect, useState } from 'react';
import EditUserModal from './components/EditUserModal';
import { TablePagination } from '@mui/material';
import CreateUserModal from './components/CreateUserModal';
import { useUser } from '../../contexts/UserContext';

const UsersManagement = () => {
  // 📌 Aquí inician los estados del componente
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const handleOpenCreate = () => setOpenCreateModal(true);
  const handleCloseCreate = () => setOpenCreateModal(false);
  const { token } = useUser();

  const URL = import.meta.env.VITE_URL_BACKEND_API + 'usuarios/api/users/';

  // 🚀 Función para buscar usuarios
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);

    const filtered = users.filter(
      (user) =>
        user.first_name?.toLowerCase().includes(value) ||
        '' ||
        user.last_name?.toLowerCase().includes(value) ||
        '' ||
        user.email?.toLowerCase().includes(value) ||
        '' ||
        user.groups?.toLowerCase().includes(value) ||
        ''
    );

    setFilteredUsers(filtered);
  };
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 🚀 Función para traer los usuarios del backend
  const fetchUsers = async (token) => {
    try {
      const response = await fetch(URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      const sortedUsers = data.data.sort((a, b) => a.id - b.id);
      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers(token);
    }
  }, [token]);

  // 🚀 Función para abrir el modal de edición
  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setOpenEditModal(true);
  };

  const handleCloseEdit = () => {
    setOpenEditModal(false);
    setSelectedUser(null);
  };

  // 🚀 Función para eliminar usuario
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`${URL}${userId}/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          alert('User deleted successfully');
          fetchUsers(); // Actualiza la lista
        } else {
          alert('Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
      }
    }
  };

  if (loading) {
    return <Typography variant="h5">Loading users...</Typography>;
  }

  // 📌 El renderizado de la tabla
  return (
    <Card>
      <CardContent>
        <Typography variant="h5">User Management</Typography>

        {/* Campo de búsqueda */}
        <Stack direction="row" sx={{ mb: 2, mt: 2 }}>
          <TextField fullWidth label="Search Users" variant="outlined" value={search} onChange={handleSearch} />
        </Stack>
        <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={handleOpenCreate}>
          Crear Usuario
        </Button>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Apellido</TableCell>
                <TableCell>Correo</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Fecha de nacimiento</TableCell>
                <TableCell>Pais</TableCell>
                <TableCell>Institucion</TableCell>
                <TableCell>Carrera</TableCell>
                <TableCell>Telefono</TableCell>
                <TableCell>Rol/roles</TableCell>
                <TableCell>Permisos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(search ? filteredUsers : users).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.first_name}</TableCell>
                  <TableCell>{user.last_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.document_id}</TableCell>
                  <TableCell>{user.fecha_nacimiento}</TableCell>
                  <TableCell>{user.pais}</TableCell>
                  <TableCell>{user.institucion}</TableCell>
                  <TableCell>{user.carrera}</TableCell>
                  <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.85rem' }}>
                    {user.groups.map((g) => g.name).join(', ')}
                  </TableCell>

                  <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.85rem' }}>
                    {(() => {
                      const perms = user.user_permissions;
                      const firstThree = perms.slice(0, 3).join(', ');
                      const remaining = perms.length - 3;
                      return `${firstThree}${remaining > 0 ? ` +${remaining} más` : ''}`;
                    })()}
                  </TableCell>
                  <TableCell>
                    <Button variant="contained" color="primary" size="small" sx={{ mr: 1 }} onClick={() => handleOpenEdit(user)}>
                      Editar
                    </Button>
                    <Button variant="contained" color="error" size="small" onClick={() => handleDeleteUser(user.id)}>
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={search ? filteredUsers.length : users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />

        {/* Modal para editar */}
        <EditUserModal open={openEditModal} handleClose={handleCloseEdit} user={selectedUser} onSave={fetchUsers} />
        <CreateUserModal open={openCreateModal} handleClose={handleCloseCreate} onSave={fetchUsers} />
      </CardContent>
    </Card>
  );
};

export default UsersManagement;
