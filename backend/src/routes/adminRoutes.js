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

/**
 * @swagger
 * /api/admin/similar-stats/{id}:
 *   get:
 *     summary: Get similar articles statistics
 *     description: Retrieve statistics about similar articles for a specific article
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Article ID
 *     responses:
 *       200:
 *         description: Similar articles statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 articleId:
 *                   type: string
 *                 similarCount:
 *                   type: number
 *                 cacheStatus:
 *                   type: string
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/similar-stats/:id', getSimilarStats);

/**
 * @swagger
 * /api/admin/clear-similar-cache/{id}:
 *   get:
 *     summary: Clear similar articles cache
 *     description: Clear the cache for similar articles of a specific article
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Article ID
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 articleId:
 *                   type: string
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/clear-similar-cache/:id', clearSimilarCache);

/**
 * @swagger
 * /api/admin/clear-all-cache-except-user:
 *   post:
 *     summary: Clear all cache except user data
 *     description: Clear all cached data except user preferences and history
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 clearedKeys:
 *                   type: number
 *                   description: Number of cache keys cleared
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/clear-all-cache-except-user', clearAllCacheExceptUser);

/**
 * @swagger
 * /api/admin/clear-specific-cache-types:
 *   post:
 *     summary: Clear specific cache types
 *     description: Clear specific types of cached data
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cacheTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [news, similar, trending, search]
 *                 description: Types of cache to clear
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 clearedTypes:
 *                   type: array
 *                   items:
 *                     type: string
 *                 clearedKeys:
 *                   type: number
 *       400:
 *         description: Invalid cache types
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/clear-specific-cache-types', clearSpecificCacheTypes);

/**
 * @swagger
 * /api/admin/cache-statistics:
 *   get:
 *     summary: Get cache statistics
 *     description: Retrieve comprehensive cache statistics and metrics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Cache statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalKeys:
 *                   type: number
 *                   description: Total number of cache keys
 *                 memoryUsage:
 *                   type: number
 *                   description: Memory usage in bytes
 *                 hitRate:
 *                   type: number
 *                   description: Cache hit rate percentage
 *                 cacheTypes:
 *                   type: object
 *                   description: Statistics by cache type
 *                 lastCleared:
 *                   type: string
 *                   format: date-time
 *                   description: Last cache clear timestamp
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/cache-statistics', getCacheStatistics);

module.exports = router; 