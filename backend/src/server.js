const express = require('express');
const cors = require('cors'); // Importa cors
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Configuración de CORS
app.use(cors({
  origin: 'http://localhost:3000', // Permite solicitudes desde el frontend en el puerto 3000
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos HTTP permitidos
  credentials: true // Si necesitas enviar cookies o encabezados de autenticación
}));

// Middleware para parsear JSON
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Hola desde el backend en Node.js!');
});

const cultivoRoutes = require('./routes/cultivoRoutes');
app.use('/api/cultivos', cultivoRoutes);
const usuarioRoutes = require('./routes/usuarioRoutes');
app.use('/api/usuarios', usuarioRoutes);
const sueloRoutes = require('./routes/sueloRoutes');
app.use('/api/suelos', sueloRoutes);
const ubicacionRoutes = require('./routes/ubicacionRoutes');
app.use('/api/ubicaciones', ubicacionRoutes);
const rolRoutes = require('./routes/rolRoutes');
app.use('/api/roles', rolRoutes);
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
