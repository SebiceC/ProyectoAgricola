const cultivoModel = require('../models/cultivoModel');

const obtenerCultivos = async (req, res) => {
  try {
    console.log("🔍 Entrando a obtenerCultivos...");
    const cultivos = await cultivoModel.getAllCultivos();
    console.log("🌾 Cultivos obtenidos:", cultivos);
    res.json(cultivos);
  } catch (error) {
    console.error("❌ Error en obtenerCultivos:", error);
    res.status(500).json({ error: 'Error al obtener cultivos' });
  }
};

const obtenerCultivoPorId = async (req, res) => {
  try {
    const id = req.params.id;
    const cultivo = await cultivoModel.getCultivoById(id);
    res.json(cultivo);
  } catch (error) {
    console.error('Error al obtener el cultivo:', error);
    res.status(500).json({ error: 'Error al obtener el cultivo' });
  }
};

const crearCultivo = async (req, res ) => {
  try { 
    const datosCultivo = req.body;
    const nuevoCultivo = await cultivoModel.createCultivo (datosCultivo);
    res.status(201).json(nuevoCultivo);
  }
  catch (error) {
    console.error('Error al crear el cultivo:', error);
    res.status(500).json({ error: 'Error al crear el cultivo' });
  }
};

const actualizarCultivo = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;
    const cultivoActualizado = await cultivoModel.updateCultivo (id, datosActualizados);
    res.json(cultivoActualizado);
  }
  catch (error) {
    console.error('Error al actualizar el cultivo:', error);
    res.status(500).json({ error: 'Error al actualizar el cultivo' });
  }
};

const eliminarCultivo = async (req, res) => {
  try {
    const { id } = req.params;
    const cultivoEliminado = await cultivoModel.deleteCultivo (id);
    res.json(cultivoEliminado);
  }
  catch (error) {
    console.error('Error al eliminar el cultivo:', error);
    res.status(500).json ({ error: 'Error al eliminar el cultivo' });
  }
};

module.exports = { 
  obtenerCultivos,
  obtenerCultivoPorId,
  crearCultivo,
  actualizarCultivo,
  eliminarCultivo 
};

