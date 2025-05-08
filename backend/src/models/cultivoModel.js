const db = require('../config/db');

const cultivoModel = {

  getAllCultivos: async () => {
    const result = await db.query('SELECT * FROM cultivos');
    return result.rows;
  },

  getCultivoById: async (id) => {
    const result = await db.query('SELECT * FROM cultivos WHERE id_cultivo = $1', [id]);
    return result.rows[0];
  },

  createCultivo: async (cultivo) => {
    const { nombre_cultivo, fecha_siembra, fecha_cosecha, profundidad_radicular, factor_agotamiento, factor_respuesta } = cultivo;
    const result = await db.query(
      'INSERT INTO cultivos (nombre_cultivo, fecha_siembra, fecha_cosecha, profundidad_radicular, factor_agotamiento, factor_respuesta) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre_cultivo, fecha_siembra, fecha_cosecha, profundidad_radicular, factor_agotamiento, factor_respuesta]
    );
    return result.rows[0];
  },

  updateCultivo: async (id, cultivo) => {
    const { nombre_cultivo, fecha_siembra, fecha_cosecha, profundidad_radicular, factor_agotamiento, factor_respuesta } = cultivo;
    const result = await db.query(
      'UPDATE cultivos SET nombre_cultivo = $1, fecha_siembra = $2, fecha_cosecha = $3, profundiad_radicular = $4, factor_agotamiento = $5, factor_respuesta = $6, WHERE id_cultivo = $7 RETURNING *',
      [nombre_cultivo,
        fecha_siembra,
        fecha_cosecha,
        profundidad_radicular,
        factor_agotamiento,
        factor_respuesta,
        id]
    );
    return result.rows[0];
  },

  deleteCultivo: async (id) => {
    const result = await db.query('DELETE FROM cultivos WHERE id_cultivo = $1 RETURNING *', [id]);
    return result.rows[0];
  },

};

module.exports = cultivoModel;