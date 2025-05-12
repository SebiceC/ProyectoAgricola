const User = require('../models/usuarioModel');

const authController = {
  async register(req, res) {
    try {
      const user = await User.createUsuario(req.body);
      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.verifyCredentials(email, password);
      
      // Aquí podrías generar un token JWT
      res.json({
        message: 'Inicio de sesión exitoso',
        user
      });
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }
};

module.exports = authController;