const db = require('../config/db');

const getAllRoles = async () => {
  const result = await db.query('SELECT * FROM roles');
  return result.rows;
};

const getRolById = async (id) => {
  const result = await db.query('SELECT * FROM roles WHERE nombre_rol = $1', [id]);
  return result.rows[0];
};

const createRol = async (rol) => {
  const { nombre, descripcion, permisos } = rol;
  const result = await db.query(
    'INSERT INTO roles (nombre_rol, descripcion_rol, permisos_rol) VALUES ($1, $2, $3) RETURNING *',
    [nombre, descripcion, permisos]
  );
  return result.rows[0];
};

const updateRol = async (id, rol) => {
  const { descripcion, permisos } = rol;
  const result = await db.query(
    'UPDATE roles SET descripcion_rol = $1, permisos_rol = $2 WHERE nombre_rol = $3 RETURNING *',
    [descripcion_rol, permisos_rol, id]
  );
  return result.rows[0];
};

const deleteRol = async (id) => {
  const result = await db.query('DELETE FROM roles WHERE nombre_rol = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getAllRoles,
  getRolById,
  createRol,
  updateRol,
  deleteRol,
};
