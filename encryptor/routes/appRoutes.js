const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');

router.post('/check', appController.check);

module.exports = router; 