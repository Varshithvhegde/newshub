const express = require('express');
const router = express.Router();

// Import the controller functions
const {
  getSimilarStats,
  clearSimilarCache
} = require('../controllers/newsController');

// Admin routes
router.get('/similar-stats/:id', getSimilarStats);
router.get('/clear-similar-cache/:id', clearSimilarCache);

module.exports = router; 