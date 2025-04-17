const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rolController');

router.get('/', rolController.obtenerRoles);
router.get('/:id', rolController.obtenerRolPorId);
router.post('/', rolController.crearRol);
router.put('/:id', rolController.actualizarRol);
router.delete('/:id', rolController.eliminarRol);

module.exports = router;
