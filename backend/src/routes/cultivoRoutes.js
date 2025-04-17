const express = require('express');
const router = express.Router();
const { obtenerCultivos } = require('../controllers/cultivoController');

router.get('/', obtenerCultivos);

module.exports = router;
