const express = require('express');
const router = express.Router();
const sueloController = require('../controllers/sueloController');

router.get('/', sueloController.obtenerSuelos);
router.get('/:id', sueloController.obtenerSueloPorId);
router.post('/', sueloController.crearSuelo);
router.put('/:id', sueloController.actualizarSuelo);
router.delete('/:id', sueloController.eliminarSuelo);

module.exports = router;
