const express = require('express');
const router = express.Router();

// Import the controller functions
const {
  getTopics,
  getSentiments,
  getSources
} = require('../controllers/newsController');

/**
 * @swagger
 * /api/metadata/topics:
 *   get:
 *     summary: Get available topics
 *     description: Retrieve list of available news topics/categories
 *     tags: [Metadata]
 *     responses:
 *       200:
 *         description: List of available topics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topics:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of available topics
 *                 count:
 *                   type: number
 *                   description: Total number of topics
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/topics', getTopics);

/**
 * @swagger
 * /api/metadata/sentiments:
 *   get:
 *     summary: Get available sentiments
 *     description: Retrieve list of available sentiment categories
 *     tags: [Metadata]
 *     responses:
 *       200:
 *         description: List of available sentiments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sentiments:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [positive, negative, neutral]
 *                   description: List of available sentiments
 *                 count:
 *                   type: number
 *                   description: Total number of sentiments
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/sentiments', getSentiments);

/**
 * @swagger
 * /api/metadata/sources:
 *   get:
 *     summary: Get available sources
 *     description: Retrieve list of available news sources
 *     tags: [Metadata]
 *     responses:
 *       200:
 *         description: List of available sources
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sources:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of available news sources
 *                 count:
 *                   type: number
 *                   description: Total number of sources
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/sources', getSources);

module.exports = router; 