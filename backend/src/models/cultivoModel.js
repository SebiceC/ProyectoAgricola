const db = require('../config/db');

const getCultivosConInfo = async () => {
  const result = await db.query(`
    SELECT 
      c.id_cultivo,
      c.nombre_cultivo,
      u.nombre AS ubicacion,
      s.tipo_suelo,
      cs.eficiencia_riego
    FROM cultivo c
    JOIN cultivo_ubicacion cu ON c.id_cultivo = cu.id_cultivo
    JOIN ubicacion u ON cu.id_ubicacion = u.ubicacion_id
    JOIN cultivo_suelo cs ON c.id_cultivo = cs.id_cultivo
    JOIN suelo s ON cs.id_suelo = s.id_suelo
  `);
  return result.rows;
};

module.exports = { getCultivosConInfo };
