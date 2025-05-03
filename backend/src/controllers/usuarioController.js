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
    const usuario = await usuarioModel.getUsuarioById();
    res.json(usuario);
  }
  catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
}

const crearUsuario = async (req, res) => {
  try {
    const nuevoUsuario = await usuarioModel.createUsuario();
    res.json(nuevoUsuario);
  }
  catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
}

const actualizarUsuario = async (req, res) => {
  try {
    const usuarioActualizado = await usuarioModel.updateUsuario();
    res.json(usuarioActualizado);
  }
  catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
}

const eliminarUsuario = async (req, res) => {
  try {
    const usuarioEliminado = await usuarioModel.deleteUsuario();
    res.json(usuarioEliminado);
  }
  catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
}
module.exports = { UsuarioController };
