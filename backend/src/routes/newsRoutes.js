const express = require('express');
const router = express.Router();

// Import the controller functions
const {
  getNewsByTopic,
  getNewsBySentiment,
  searchNews,
  getArticleById,
  getSimilarArticles,
  getAllNews,
  getArticleMetrics,
  getUserArticleHistory,
  getTrendingArticles
} = require('../controllers/newsController');

// News routes (specific routes first)
router.get('/topic/:topic', getNewsByTopic);
router.get('/sentiment/:sentiment', getNewsBySentiment);
router.get('/search', searchNews);
router.get('/trending', getTrendingArticles);
router.get('/:id/metrics', getArticleMetrics);
router.get('/:id/similar', getSimilarArticles);
router.get('/:id', getArticleById);

// Catch-all route for all news (must be last)
router.get('/', getAllNews);

module.exports = router; 