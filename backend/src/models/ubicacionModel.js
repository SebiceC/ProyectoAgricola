const pool = require('../config/db');

const getAllUbicaciones = async () => {
  const result = await pool.query('SELECT * FROM ubicacion');
  return result.rows;
};

const getUbicacionById = async (id) => {
  const result = await pool.query('SELECT * FROM ubicacion WHERE id_ubicacion = $1', [id]);
  return result.rows[0];
};

const createUbicacion = async (ubicacion) => {
  const { nombre, pais, altitud, longitud, latitud } = ubicacion;
  const result = await pool.query(
    'INSERT INTO ubicacion (nombre, pais, altitud, longitud, latitud) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [nombre, pais, altitud, longitud, latitud]
  );
  return result.rows[0];
};

const updateUbicacion = async (id, ubicacion) => {
  const { nombre, pais, altitud, longitud, latitud } = ubicacion;
  const result = await pool.query(
    `UPDATE ubicacion 
     SET nombre = $1, pais = $2, altitud = $3, longitud = $4, latitud = $5 
     WHERE id_ubicacion = $6 RETURNING *`,
    [nombre, pais, altitud, longitud, latitud, id]
  );
  return result.rows[0];
};

const deleteUbicacion = async (id) => {
  await pool.query('DELETE FROM ubicacion WHERE id_ubicacion = $1', [id]);
};

module.exports = {
  getAllUbicaciones,
  getUbicacionById,
  createUbicacion,
  updateUbicacion,
  deleteUbicacion
};
