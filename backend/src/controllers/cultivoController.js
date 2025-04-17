const { getCultivosConInfo } = require('../models/cultivoModel');

const obtenerCultivos = async (req, res) => {
  try {
    console.log("🔍 Entrando a obtenerCultivos...");
    const cultivos = await getCultivosConInfo();
    console.log("🌾 Cultivos obtenidos:", cultivos);
    res.json(cultivos);
  } catch (error) {
    console.error("❌ Error en obtenerCultivos:", error);
    res.status(500).json({ error: 'Error al obtener cultivos' });
  }
};


module.exports = { obtenerCultivos };
