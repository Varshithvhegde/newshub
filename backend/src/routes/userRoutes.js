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

/**
 * @swagger
 * /api/user/generate-id:
 *   post:
 *     summary: Generate user ID
 *     description: Generate a unique user identifier for anonymous users
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User ID generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   description: Generated user ID
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/generate-id', generateUserId);

/**
 * @swagger
 * /api/user/{userId}/preferences:
 *   post:
 *     summary: Store user preferences
 *     description: Store user preferences for personalized news recommendations
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topics:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Preferred news topics
 *               sources:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Preferred news sources
 *               sentiment:
 *                 type: string
 *                 enum: [positive, negative, neutral, all]
 *                 description: Preferred sentiment filter
 *     responses:
 *       200:
 *         description: Preferences stored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 preferences:
 *                   type: object
 *                   description: Stored preferences
 *       400:
 *         description: Invalid preferences data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:userId/preferences', storeUserPreferences);

/**
 * @swagger
 * /api/user/{userId}/preferences:
 *   get:
 *     summary: Get user preferences
 *     description: Retrieve stored user preferences
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User preferences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topics:
 *                   type: array
 *                   items:
 *                     type: string
 *                 sources:
 *                   type: array
 *                   items:
 *                     type: string
 *                 sentiment:
 *                   type: string
 *       404:
 *         description: User preferences not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:userId/preferences', getUserPreferences);

/**
 * @swagger
 * /api/user/{userId}/preferences:
 *   put:
 *     summary: Update user preferences
 *     description: Update existing user preferences
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topics:
 *                 type: array
 *                 items:
 *                     type: string
 *               sources:
 *                 type: array
 *                 items:
 *                     type: string
 *               sentiment:
 *                 type: string
 *                 enum: [positive, negative, neutral, all]
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 preferences:
 *                   type: object
 *       404:
 *         description: User preferences not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:userId/preferences', updateUserPreferences);

/**
 * @swagger
 * /api/user/{userId}/personalized-news:
 *   get:
 *     summary: Get personalized news
 *     description: Retrieve personalized news articles based on user preferences
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *         description: Personalized news articles
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
 *         description: User preferences not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:userId/personalized-news', getPersonalizedNews);

/**
 * @swagger
 * /api/user/{userId}/personalized-news/search:
 *   get:
 *     summary: Search personalized news
 *     description: Search within personalized news articles
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *     responses:
 *       200:
 *         description: Search results from personalized news
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
 *       404:
 *         description: User preferences not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:userId/personalized-news/search', getPersonalizedNewsSearch);

/**
 * @swagger
 * /api/user/{userId}/history:
 *   get:
 *     summary: Get user article history
 *     description: Retrieve user's article reading history
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *         description: User's article history
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
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:userId/history', getUserArticleHistory);

module.exports = router; 