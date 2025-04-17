const pool = require('../config/db');

const getAllRoles = async () => {
  const result = await pool.query('SELECT * FROM rol');
  return result.rows;
};

const getRolById = async (id) => {
  const result = await pool.query('SELECT * FROM rol WHERE nombre_rol = $1', [id]);
  return result.rows[0];
};

const createRol = async (rol) => {
  const { nombre_rol, descripcion_rol, permisos_rol } = rol;
  const result = await pool.query(
    'INSERT INTO rol (nombre_rol, descripcion_rol, permisos_rol) VALUES ($1, $2, $3) RETURNING *',
    [nombre_rol, descripcion_rol, permisos_rol]
  );
  return result.rows[0];
};

const updateRol = async (id, rol) => {
  const { descripcion_rol, permisos_rol } = rol;
  const result = await pool.query(
    'UPDATE rol SET descripcion_rol = $1, permisos_rol = $2 WHERE nombre_rol = $3 RETURNING *',
    [descripcion_rol, permisos_rol, id]
  );
  return result.rows[0];
};

const deleteRol = async (id) => {
  const result = await pool.query('DELETE FROM rol WHERE nombre_rol = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getAllRoles,
  getRolById,
  createRol,
  updateRol,
  deleteRol,
};
