const express = require('express');
const router = express.Router();

// Import the controller functions
const {
  getTopics,
  getSentiments,
  getSources
} = require('../controllers/newsController');

// Metadata routes
router.get('/topics', getTopics);
router.get('/sentiments', getSentiments);
router.get('/sources', getSources);

module.exports = router; 