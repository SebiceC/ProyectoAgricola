const db = require('../config/db');

const UsuarioModel = {
  getAllUsuarios: async () => {
    const result = await db.query('SELECT * FROM usuarios');
    return result.rows;
  },

  getUsuarioById: async (id) => {
    const result = await db.query('SELECT * FROM usuarios WHERE id_usuario = $1', [id]);
    return result.rows[0];
  },

  createUsuario: async (usuario) => { 
    const { nombre, apellido, email, password } = usuario;
    const result = await db.query(
      'INSERT INTO usuarios (nombre_usuario, apellido_usuario, email_usuario, contraseña_hash_usuario) VALUES ($1, $2, $3, $4) RETURNING *', 
      [nombre, apellido, email, password]
    );
    return result.rows[0];
  },

  updateUsuario: async (id, usuario) => {
    const { nombre, apellido, email, password, rol } = usuario;
    const result = await db.query(
      'UPDATE usuarios SET nombre_usuario = $1, apellido_usuario = $2, email_usuario = $3, contraseña_hash_usuario = $4, rol_id = $5 WHERE id_usuario = $6 RETURNING *', 
      [nombre, apellido, email, password, rol, id]
    );
    return result.rows[0];
  },

  deleteUsuario: async (id) => {
    const result = await db.query('DELETE FROM usuarios WHERE id_usuario = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

module.exports = UsuarioModel;