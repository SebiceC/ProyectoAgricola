const pool = require('../config/db');

const getAllCultivos = async () => {
  const result = await pool.query('SELECT * FROM cultivo');
  return result.rows;
};

const getCultivoById = async (id) => {
  const result = await pool.query('SELECT * FROM cultivo WHERE id_cultivo = $1', [id]);
  return result.rows[0];
};

const createCultivo = async (cultivo) => {
  const { nombre_cultivo, fecha_siembra, fecha_cosecha, profundidad_radicular, factor_agotamiento, factor_respuesta } = cultivo;
  const result = await pool.query(
    'INSERT INTO cultivo (nombre_cultivo, fecha_siembra, fecha_cosecha, profundidad_radicular, factor_agotamiento, factor_respuesta) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [nombre_cultivo, fecha_siembra, fecha_cosecha, profundidad_radicular, factor_agotamiento, factor_respuesta]
  );
  return result.rows[0];
};

const updateCultivo = async (id, cultivo) => {
  const { nombre_cultivo, fecha_siembra, fecha_cosecha, profundidad_radicular, factor_agotamiento, factor_respuesta } = cultivo;
  const result = await pool.query(
    'UPDATE cultivo SET nombre_cultivo = $1, fecha_siembra = $2, fecha_cosecha = $3, profundiad_radicular = $4, factor_agotamiento = $5, factor_respuesta = $6, WHERE id_cultivo = $7 RETURNING *',
    [nombre_cultivo,
      fecha_siembra,
      fecha_cosecha,
      profundidad_radicular,
      factor_agotamiento,
      factor_respuesta,
      id]
  );
  return result.rows[0];
};

const deleteCultivo = async (id) => {
  const result = await pool.query('DELETE FROM cultivo WHERE id_cultivo = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getAllCultivos,
  getCultivoById,
  createCultivo,
  updateCultivo,
  deleteCultivo,
};dasads