const db = require('../config/db');

const getAllSuelos = async () => {
    const result = await db.query('SELECT * FROM suelo');
    return result.rows;
};

const getSueloById = async (id) => {
    const result = await db.query('SELECT * FROM suelo WHERE id = $1', [id]);
    return result.rows[0];
};

const createSuelo = async (data) => {
    const { tipo_suelo, caracteristicas } = data;
    const result = await db.query(
        'INSERT INTO suelo (tipo_suelo, caracteristicas) VALUES ($1, $2) RETURNING *',
        [tipo_suelo, caracteristicas]
    );
    return result.rows[0];
};
const updateSuelo = async (id, data) => {
    const { tipo_suelo, caracteristicas } = data;
    const result = await db.query(
        'UPDATE suelo SET tipo_suelo = $1, caracteristicas = $2 WHERE id = $3 RETURNING *',
        [tipo_suelo, caracteristicas, id]
    );
    return result.rows[0];
};
const deleteSuelo = async (id) => {
    await db.query('DELETE FROM suelo WHERE id_suelo = $1', [id]);
};
module.exports = {
    getAllSuelos,
    getSueloById,
    createSuelo,
    updateSuelo,
    deleteSuelo
};