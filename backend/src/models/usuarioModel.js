const db = require('../config/db');

const getAllUsuarios = async () => {
  const result = await db.query('SELECT * FROM usuarios');
  return result.rows;
};

module.exports = { getAllUsuarios };

