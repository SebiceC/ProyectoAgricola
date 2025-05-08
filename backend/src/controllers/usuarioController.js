const usuarioModel = require('../models/usuarioModel');

const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await usuarioModel.getAllUsuarios();
    res.json(usuarios);
  }
  catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

const obtenerUsuarioPorId = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'ID de usuario no proporcionado' });
    }
    const usuario = await usuarioModel.getUsuarioById(id);
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
};

const crearUsuario = async (req, res) => {
  try {
    const datosUsuario = req.body;
    const nuevoUsuario = await usuarioModel.createUsuario(datosUsuario);
    res.status(201).json(nuevoUsuario);
  }
  catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;
    const usuarioActualizado = await usuarioModel.updateUsuario(id, datosActualizados);
    res.json(usuarioActualizado);
  }
  catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioEliminado = await usuarioModel.deleteUsuario(id);
    res.json(usuarioEliminado);
  }
  catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};

module.exports = { 
  obtenerUsuarioPorId,
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
};
