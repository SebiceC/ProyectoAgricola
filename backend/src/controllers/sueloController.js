const sueloModel = require('../models/sueloModel');

const obtenerSuelos = async (req, res) => {
  try {
    const suelos = await sueloModel.getAllSuelos();
    res.json(suelos);
  } catch (error) {
    console.error('Error al obtener suelos:', error);
    res.status(500).json({ error: 'Error al obtener suelos' });
  }
};

const obtenerSueloPorId = async (req, res) => {
  try {
    const suelo = await sueloModel.getSueloById(req.params.id);
    res.json(suelo);
  } catch (error) {
    console.error('Error al obtener suelo:', error);
    res.status(500).json({ error: 'Error al obtener suelo' });
  }
};

const crearSuelo = async (req, res) => {
  try {
    const nuevoSuelo = await sueloModel.createSuelo(req.body);
    res.status(201).json(nuevoSuelo);
  } catch (error) {
    console.error('Error al crear suelo:', error);
    res.status(500).json({ error: 'Error al crear suelo' });
  }
};

const actualizarSuelo = async (req, res) => {
  try {
    const sueloActualizado = await sueloModel.updateSuelo(req.params.id, req.body);
    res.json(sueloActualizado);
  } catch (error) {
    console.error('Error al actualizar suelo:', error);
    res.status(500).json({ error: 'Error al actualizar suelo' });
  }
};

const eliminarSuelo = async (req, res) => {
  try {
    await sueloModel.deleteSuelo(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar suelo:', error);
    res.status(500).json({ error: 'Error al eliminar suelo' });
  }
};

module.exports = {
  obtenerSuelos,
  obtenerSueloPorId,
  crearSuelo,
  actualizarSuelo,
  eliminarSuelo,
};
