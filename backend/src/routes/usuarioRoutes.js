const express = require('express');
const router = express.Router();
const { obtenerUsuarios } = require('../controllers/usuarioController');

router.get('/', obtenerUsuarios);

module.exports = router;
