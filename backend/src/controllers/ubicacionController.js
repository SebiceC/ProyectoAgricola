const ubicacionModel = require('../models/ubicacionModel');

const obtenerUbicaciones = async (req, res) => {
  try {
    const ubicaciones = await ubicacionModel.getAllUbicaciones();
    res.json(ubicaciones);
  } catch (error) {
    console.error('Error al obtener ubicaciones:', error);
    res.status(500).json({ error: 'Error al obtener ubicaciones' });
  }
};

const obtenerUbicacionPorId = async (req, res) => {
  try {
    const id = req.params.id;
    const ubicacion = await ubicacionModel.getUbicacionById(id);
    if (!ubicacion) {
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }
    res.json(ubicacion);
  } catch (error) {
    console.error('Error al obtener ubicación:', error);
    res.status(500).json({ error: 'Error al obtener ubicación' });
  }
};

const crearUbicacion = async (req, res) => {
  try {
    const nuevaUbicacion = await ubicacionModel.createUbicacion(req.body);
    res.status(201).json(nuevaUbicacion);
  } catch (error) {
    console.error('Error al crear ubicación:', error);
    res.status(500).json({ error: 'Error al crear ubicación' });
  }
};

const actualizarUbicacion = async (req, res) => {
  try {
    const id = req.params.id;
    const ubicacionActualizada = await ubicacionModel.updateUbicacion(id, req.body);
    res.json(ubicacionActualizada);
  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
    res.status(500).json({ error: 'Error al actualizar ubicación' });
  }
};

const eliminarUbicacion = async (req, res) => {
  try {
    const id = req.params.id;
    await ubicacionModel.deleteUbicacion(id);
    res.json({ message: 'Ubicación eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar ubicación:', error);
    res.status(500).json({ error: 'Error al eliminar ubicación' });
  }
};

module.exports = {
  obtenerUbicaciones,
  obtenerUbicacionPorId,
  crearUbicacion,
  actualizarUbicacion,
  eliminarUbicacion
};
