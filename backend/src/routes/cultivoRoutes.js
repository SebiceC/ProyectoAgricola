const express = require('express');
const router = express.Router();
const { 
    obtenerCultivos, 
    obtenerCultivoPorId,
    crearCultivo,
    actualizarCultivo,
    eliminarCultivo

} = require('../controllers/cultivoController');

router.get('/', obtenerCultivos);
router.get('/:id', obtenerCultivoPorId);
router.post('/', crearCultivo);
router.put('/:id', actualizarCultivo);
router.delete('/:id', eliminarCultivo);

module.exports = router;
