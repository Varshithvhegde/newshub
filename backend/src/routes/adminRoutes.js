const express = require('express');
const router = express.Router();

// Import the controller functions
const {
  getSimilarStats,
  clearSimilarCache,
  clearAllCacheExceptUser,
  clearSpecificCacheTypes,
  getCacheStatistics
} = require('../controllers/newsController');

// Admin routes
router.get('/similar-stats/:id', getSimilarStats);
router.get('/clear-similar-cache/:id', clearSimilarCache);

// Cache management routes
router.post('/clear-all-cache-except-user', clearAllCacheExceptUser);
router.post('/clear-specific-cache-types', clearSpecificCacheTypes);
router.get('/cache-statistics', getCacheStatistics);

module.exports = router; 