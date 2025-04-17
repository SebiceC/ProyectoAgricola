const rolModel = require('../models/rolModel');

const obtenerRoles = async (req, res) => {
  try {
    console.log('🟡 Obteniendo roles...');
    const roles = await rolModel.getAllRoles();
    res.json(roles);
  } catch (error) {
    console.error('❌ Error al obtener roles:', error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};

const obtenerRolPorId = async (req, res) => {
  try {
    const id = req.params.id;
    const rol = await rolModel.getRolById(id);
    if (rol) {
      res.json(rol);
    } else {
      res.status(404).json({ error: 'Rol no encontrado' });
    }
  } catch (error) {
    console.error('❌ Error al obtener rol:', error);
    res.status(500).json({ error: 'Error al obtener rol' });
  }
};

const crearRol = async (req, res) => {
  try {
    const nuevoRol = await rolModel.createRol(req.body);
    res.status(201).json(nuevoRol);
  } catch (error) {
    console.error('❌ Error al crear rol:', error);
    res.status(500).json({ error: 'Error al crear rol' });
  }
};

const actualizarRol = async (req, res) => {
  try {
    const id = req.params.id;
    const rolActualizado = await rolModel.updateRol(id, req.body);
    if (rolActualizado) {
      res.json(rolActualizado);
    } else {
      res.status(404).json({ error: 'Rol no encontrado' });
    }
  } catch (error) {
    console.error('❌ Error al actualizar rol:', error);
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
};

const eliminarRol = async (req, res) => {
  try {
    const id = req.params.id;
    const rolEliminado = await rolModel.deleteRol(id);
    if (rolEliminado) {
      res.json(rolEliminado);
    } else {
      res.status(404).json({ error: 'Rol no encontrado' });
    }
  } catch (error) {
    console.error('❌ Error al eliminar rol:', error);
    res.status(500).json({ error: 'Error al eliminar rol' });
  }
};

module.exports = {
  obtenerRoles,
  obtenerRolPorId,
  crearRol,
  actualizarRol,
  eliminarRol,
};
