const express = require('express');
const router = express.Router();

// Import the controller functions
const {
  generateUserId,
  storeUserPreferences,
  getUserPreferences,
  updateUserPreferences,
  getPersonalizedNews,
  getPersonalizedNewsSearch,
  getUserArticleHistory
} = require('../controllers/newsController');

// User routes
router.post('/generate-id', generateUserId);
router.post('/:userId/preferences', storeUserPreferences);
router.get('/:userId/preferences', getUserPreferences);
router.put('/:userId/preferences', updateUserPreferences);
router.get('/:userId/personalized-news', getPersonalizedNews);
router.get('/:userId/personalized-news/search', getPersonalizedNewsSearch);
router.get('/:userId/history', getUserArticleHistory);

module.exports = router; 