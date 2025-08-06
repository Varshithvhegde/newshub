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

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get all news articles
 *     description: Retrieve all news articles with pagination support
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of articles per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, oldest, relevance]
 *           default: latest
 *         description: Sort order for articles
 *     responses:
 *       200:
 *         description: List of news articles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 articles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getAllNews);

/**
 * @swagger
 * /api/news/topic/{topic}:
 *   get:
 *     summary: Get news by topic
 *     description: Retrieve news articles filtered by specific topic
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *         description: Topic to filter by (e.g., politics, technology, sports)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of articles per page
 *     responses:
 *       200:
 *         description: List of news articles for the specified topic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 articles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       404:
 *         description: Topic not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/topic/:topic', getNewsByTopic);

/**
 * @swagger
 * /api/news/sentiment/{sentiment}:
 *   get:
 *     summary: Get news by sentiment
 *     description: Retrieve news articles filtered by sentiment analysis
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: sentiment
 *         required: true
 *         schema:
 *           type: string
 *           enum: [positive, negative, neutral]
 *         description: Sentiment to filter by
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of articles per page
 *     responses:
 *       200:
 *         description: List of news articles with the specified sentiment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 articles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid sentiment value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/sentiment/:sentiment', getNewsBySentiment);

/**
 * @swagger
 * /api/news/search:
 *   get:
 *     summary: Search news articles
 *     description: Search news articles by keywords with advanced filtering
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of articles per page
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         description: Filter by topic
 *       - in: query
 *         name: sentiment
 *         schema:
 *           type: string
 *           enum: [positive, negative, neutral]
 *         description: Filter by sentiment
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 articles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 query:
 *                   type: string
 *                   description: The search query used
 *       400:
 *         description: Invalid search parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/search', searchNews);

/**
 * @swagger
 * /api/news/trending:
 *   get:
 *     summary: Get trending articles
 *     description: Retrieve trending news articles based on engagement and recency
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of trending articles to return
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d]
 *           default: 24h
 *         description: Time period for trending calculation
 *     responses:
 *       200:
 *         description: List of trending articles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 articles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 *                 period:
 *                   type: string
 *                   description: The time period used for trending calculation
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/trending', getTrendingArticles);

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Get article by ID
 *     description: Retrieve a specific news article by its unique identifier
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Article ID
 *     responses:
 *       200:
 *         description: Article details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getArticleById);

/**
 * @swagger
 * /api/news/{id}/similar:
 *   get:
 *     summary: Get similar articles
 *     description: Retrieve articles similar to the specified article
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Article ID to find similar articles for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of similar articles to return
 *     responses:
 *       200:
 *         description: List of similar articles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 articles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 *                 originalArticle:
 *                   $ref: '#/components/schemas/Article'
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/similar', getSimilarArticles);

/**
 * @swagger
 * /api/news/{id}/metrics:
 *   get:
 *     summary: Get article metrics
 *     description: Retrieve engagement metrics for a specific article
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Article ID
 *     responses:
 *       200:
 *         description: Article metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 views:
 *                   type: number
 *                   description: Number of views
 *                 shares:
 *                   type: number
 *                   description: Number of shares
 *                 likes:
 *                   type: number
 *                   description: Number of likes
 *                 comments:
 *                   type: number
 *                   description: Number of comments
 *                 engagementRate:
 *                   type: number
 *                   description: Overall engagement rate
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/metrics', getArticleMetrics);

module.exports = router; 