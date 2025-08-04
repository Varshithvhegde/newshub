const express = require('express');
const router = express.Router();

// Import the controller functions
const {
  healthCheck
} = require('../controllers/newsController');

// Health check route
router.get('/', healthCheck);

module.exports = router; 