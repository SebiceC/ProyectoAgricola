const { getAllUsuarios } = require('../models/usuarioModel');

const obtenerUsuarios = async (req, res) => {
  try {
    console.log("👤 Obteniendo usuarios...");
    const usuarios = await getAllUsuarios();
    res.json(usuarios);
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};
module.exports = { obtenerUsuarios };
