const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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


// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
