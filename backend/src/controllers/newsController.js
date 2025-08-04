require('dotenv').config();
const { 
  redis, 
  searchArticlesByTopic, 
  searchArticlesBySentiment, 
  getAllArticles,
  createSearchIndex,
  findSimilarArticles,
  getSimilarArticleCacheStats,
  clearSimilarArticleCache,
  // Add these new imports
  storeUserPreferences,
  getUserPreferences,
  updateUserPreferences,
  getPersonalizedNews,
  clearPersonalizedCache,
  getPersonalizedNewsSearch,
  getAllSources,
  markArticleAsRead,
  // Add the new search functions
  searchNewsWithQuery,
  searchNewsWithTopicIntersection,
  searchNews,
  getArticleMetrics,
  getUserArticleHistory,
  getTrendingArticles,
  // Add article metrics tracking
  trackArticleMetrics,
  // Add cache clearing functions
  clearAllCacheExceptUser,
  clearSpecificCacheTypes,
  getCacheStatistics
} = require('../services/redisService');
const { getPaginationParams, createPaginatedResponse } = require('../utils/pagination');

// Get news by topic (with pagination)
async function getNewsByTopic(req, res) {
  try {
    const { topic } = req.params;
    const { page, limit, offset } = getPaginationParams(req);
    
    const result = await searchArticlesByTopic(topic, limit, offset);
    const response = createPaginatedResponse(
      result.articles, 
      result.totalCount, 
      page, 
      limit, 
      req
    );
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching news by topic:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
}

// Get news by sentiment (with pagination)
async function getNewsBySentiment(req, res) {
  try {
    const { sentiment } = req.params;
    const { page, limit, offset } = getPaginationParams(req);
    
    const result = await searchArticlesBySentiment(sentiment, limit, offset);
    const response = createPaginatedResponse(
      result.articles, 
      result.totalCount, 
      page, 
      limit, 
      req
    );
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching news by sentiment:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
}

// Search news with custom query (with pagination)
async function searchNewsHandler(req, res) {
  try {
    const { q, sentiment, source, topic } = req.query;
    const { page, limit, offset } = getPaginationParams(req);
    
    // Use the comprehensive search function from redisService
    const result = await searchNews(
      { q, sentiment, source, topic },
      { page, limit, offset }
    );
    
    const response = createPaginatedResponse(
      result.articles, 
      result.totalCount, 
      page, 
      limit, 
      req
    );
    
    res.json(response);
  } catch (error) {
    console.error('Error searching news:', error);
    res.status(500).json({ error: 'Failed to search news' });
  }
}

// Get a single article by ID with comprehensive metrics tracking
async function getArticleById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] || req.query.userId; // Get userId from header or query
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    console.log(`Article view request - ID: ${id}, User: ${userId}, IP: ${ipAddress}`);
    
    const key = `news:${id}`;
    const article = await redis.json.get(key);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Track comprehensive metrics
    const metrics = await trackArticleMetrics(id, userId, {
      userAgent,
      ipAddress,
      timestamp: Date.now(),
      referrer: req.headers.referer || 'direct',
      language: req.headers['accept-language'] || 'unknown'
    });

    // Mark article as read if userId is provided
    if (userId) {
      // Fire and forget these background tasks
      Promise.all([
        markArticleAsRead(userId, id),
        clearPersonalizedCache(userId),
        getPersonalizedNews(userId)
      ]).catch(err => {
        console.error('Background tasks failed:', err);
      });
    }

    console.log(metrics);
    // Return article with metrics
    const response = {
      ...article,
      metrics: {
        totalViews: metrics.totalViews,
        uniqueViews: metrics.uniqueViews,
        userViews: metrics.userViews,
        engagement: metrics.engagement,
        lastViewed: metrics.lastViewed
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
}

// Get similar articles using Redis Vector Search (with pagination)
async function getSimilarArticles(req, res) {
  try {
    console.log(req.params);
    const { id } = req.params;
    const { page, limit, offset } = getPaginationParams(req);
    
    const result = await findSimilarArticles(id, limit, offset);
    const response = createPaginatedResponse(
      result.articles, 
      result.totalCount, 
      page, 
      limit, 
      req
    );
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching similar articles:', error);
    res.status(500).json({ error: 'Failed to fetch similar articles' });
  }
}

// Get all news articles (with pagination)
async function getAllNews(req, res) {
  try {
    console.log("Getting paginated news articles");
    const { page, limit, offset } = getPaginationParams(req);
    
    const result = await getAllArticles(limit, offset);
    const response = createPaginatedResponse(
      result.articles, 
      result.totalCount, 
      page, 
      limit, 
      req
    );
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
}

// Get available topics
async function getTopics(req, res) {
  const topics = [
    'India',
    'Technology', 
    'Politics',
    'World',
    'Sports',
    'Business',
    'Entertainment',
    'Science',
    'Health'
  ];
  res.json(topics);
}

// Get available sentiments
async function getSentiments(req, res) {
  const sentiments = ['positive', 'negative', 'neutral'];
  res.json(sentiments);
}

// Get available sources (with pagination)
async function getSources(req, res) {
  try {
    const sources = await getAllSources();
    res.json(sources);
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.json({
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        limit: 10,
        hasNext: false,
        hasPrev: false
      }
    });
  }
}

// Generate unique user ID endpoint
async function generateUserId(req, res) {
  try {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.json({ userId });
  } catch (error) {
    console.error('Error generating user ID:', error);
    res.status(500).json({ error: 'Failed to generate user ID' });
  }
}

// Store user preferences
async function storeUserPreferencesHandler(req, res) {
  try {
    const { userId } = req.params;

    // req.body is returning { topics: [ 'india' ] }
    const preferences = req.body.topics;
    if (!preferences || !Array.isArray(preferences)) {
      console.log(req.body);
      return res.status(400).json({ error: 'Preferences must be an array' });
    }
    
    // Validate and clean preferences
    const cleanPreferences = preferences
      .filter(pref => typeof pref === 'string' && pref.trim().length > 0)
      .map(pref => pref.trim().toLowerCase())
      .slice(0, 10); // Limit to 10 preferences
    
    if (cleanPreferences.length === 0) {
      return res.status(400).json({ error: 'At least one valid preference is required' });
    }
    
    await storeUserPreferences(userId, cleanPreferences);
    res.json({ 
      message: 'Preferences stored successfully',
      preferences: cleanPreferences
    });
  } catch (error) {
    console.error('Error storing user preferences:', error);
    res.status(500).json({ error: 'Failed to store preferences' });
  }
}

// Get user preferences
async function getUserPreferencesHandler(req, res) {
  try {
    const { userId } = req.params;
    const userPrefs = await getUserPreferences(userId);
    
    if (!userPrefs) {
      return res.status(404).json({ error: 'User preferences not found' });
    }
    
    res.json(userPrefs);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
}

// Update user preferences
async function updateUserPreferencesHandler(req, res) {
  try {
    const { userId } = req.params;
    const preferences = req.body.topics;
    console.log(preferences);
    if (!preferences || !Array.isArray(preferences)) {

      return res.status(400).json({ error: 'Preferences must be an array' });
    }
    
    const cleanPreferences = preferences
      .filter(pref => typeof pref === 'string' && pref.trim().length > 0)
      .map(pref => pref.trim().toLowerCase())
      .slice(0, 10);
    
    if (cleanPreferences.length === 0) {
      return res.status(400).json({ error: 'At least one valid preference is required' });
    }
    
    await updateUserPreferences(userId, cleanPreferences);
    res.json({ 
      message: 'Preferences updated successfully',
      preferences: cleanPreferences
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
}

// Get personalized news feed
async function getPersonalizedNewsHandler(req, res) {
  try {
    const { userId } = req.params;
    const { page, limit, offset } = getPaginationParams(req);
    
    const result = await getPersonalizedNews(userId, limit, offset);
    const response = createPaginatedResponse(
      result.articles,
      result.totalCount,
      page,
      limit,
      req
    );
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching personalized news:', error);
    res.status(500).json({ error: 'Failed to fetch personalized news' });
  }
}

// Get personalized news with additional filters
async function getPersonalizedNewsSearchHandler(req, res) {
  try {
    const { userId } = req.params;
    const { q, sentiment, source } = req.query;
    const { page, limit, offset } = getPaginationParams(req);
    
    const result = await getPersonalizedNewsSearch(userId, limit, offset, q, sentiment, source);
    
    const response = createPaginatedResponse(
      result.articles, 
      result.totalCount, 
      page, 
      limit, 
      req
    );
    
    // Add search-specific metadata
    response.personalizedCount = result.personalizedCount;
    response.searchQuery = result.searchQuery;
    response.filters = result.filters;
    response.cached = result.cached;
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching personalized search results:', error);
    res.status(500).json({ error: 'Failed to fetch personalized search results' });
  }
}

async function getSimilarStats(req, res) {
  try {
    const { id } = req.params;
    const stats = await getSimilarArticleCacheStats(id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching similar article cache stats:', error);
    res.status(500).json({ error: 'Failed to fetch similar article cache stats' });
  }
}

async function clearSimilarCache(req, res) {
  try {
    const { id } = req.params;
    await clearSimilarArticleCache(id);
    res.json({ message: 'Similar article cache cleared' });
  } catch (error) {
    console.error('Error clearing similar article cache:', error);
    res.status(500).json({ error: 'Failed to clear similar article cache' });
  }
}

// Get article metrics (detailed analytics)
async function getArticleMetricsHandler(req, res) {
  try {
    const { id } = req.params;
    const metrics = await getArticleMetrics(id);
    
    res.json({
      articleId: id,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching article metrics:', error);
    res.status(500).json({ error: 'Failed to fetch article metrics' });
  }
}

// Get user's article viewing history
async function getUserArticleHistoryHandler(req, res) {
  try {
    const { userId } = req.params;
    const history = await getUserArticleHistory(userId);
    
    res.json({
      userId,
      history,
      totalArticles: history.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user article history:', error);
    res.status(500).json({ error: 'Failed to fetch user article history' });
  }
}

// Get trending articles
async function getTrendingArticlesHandler(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const trendingArticles = await getTrendingArticles(limit);
    
    res.json({
      trendingArticles,
      totalCount: trendingArticles.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching trending articles:', error);
    res.status(500).json({ error: 'Failed to fetch trending articles' });
  }
}

// Health check
async function healthCheck(req, res) {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
}

// Clear all cache except user data
async function clearAllCacheExceptUserHandler(req, res) {
  try {
    console.log('Admin request to clear all cache except user data');
    const result = await clearAllCacheExceptUser();
    
    res.json({
      message: 'Cache cleared successfully',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
}

// Clear specific cache types
async function clearSpecificCacheTypesHandler(req, res) {
  try {
    const { types } = req.query;
    const cacheTypes = types ? types.split(',').map(type => type.trim()) : [];
    
    console.log(`Admin request to clear specific cache types: ${cacheTypes.join(', ')}`);
    const result = await clearSpecificCacheTypes(cacheTypes);
    
    res.json({
      message: 'Specific cache types cleared successfully',
      cacheTypes,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing specific cache types:', error);
    res.status(500).json({ error: 'Failed to clear specific cache types' });
  }
}

// Get cache statistics
async function getCacheStatisticsHandler(req, res) {
  try {
    console.log('Admin request to get cache statistics');
    const stats = await getCacheStatistics();
    
    res.json({
      message: 'Cache statistics retrieved successfully',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting cache statistics:', error);
    res.status(500).json({ error: 'Failed to get cache statistics' });
  }
}

module.exports = {
  getNewsByTopic,
  getNewsBySentiment,
  searchNews: searchNewsHandler,
  getArticleById,
  getSimilarArticles,
  getAllNews,
  getTopics,
  getSentiments,
  getSources,
  generateUserId,
  storeUserPreferences: storeUserPreferencesHandler,
  getUserPreferences: getUserPreferencesHandler,
  updateUserPreferences: updateUserPreferencesHandler,
  getPersonalizedNews: getPersonalizedNewsHandler,
  getPersonalizedNewsSearch: getPersonalizedNewsSearchHandler,
  getSimilarStats,
  clearSimilarCache,
  getArticleMetrics: getArticleMetricsHandler,
  getUserArticleHistory: getUserArticleHistoryHandler,
  getTrendingArticles: getTrendingArticlesHandler,
  healthCheck,
  // Add cache clearing functions
  clearAllCacheExceptUser: clearAllCacheExceptUserHandler,
  clearSpecificCacheTypes: clearSpecificCacheTypesHandler,
  getCacheStatistics: getCacheStatisticsHandler
};