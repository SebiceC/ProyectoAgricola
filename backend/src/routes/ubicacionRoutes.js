const express = require('express');
const router = express.Router();
const ubicacionController = require('../controllers/ubicacionController');

router.get('/', ubicacionController.obtenerUbicaciones);
router.get('/:id', ubicacionController.obtenerUbicacionPorId);
router.post('/', ubicacionController.crearUbicacion);
router.put('/:id', ubicacionController.actualizarUbicacion);
router.delete('/:id', ubicacionController.eliminarUbicacion);

module.exports = router;
