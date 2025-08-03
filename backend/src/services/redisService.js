require('dotenv').config();
const { createClient } = require('redis');
const { generateEmbedding } = require('./geminiService'); 
const redis = createClient({ url: process.env.REDIS_URL });
redis.connect();

async function storeArticle(article) {
  const key = `news:${article.id}`;
  await redis.json.set(key, '$', article);
}

async function articleExists(id) {
  const key = `news:${id}`;
  const exists = await redis.exists(key);
  return exists === 1;
}

// Enhanced RedisSearch index with better similarity features
async function createSearchIndex() {
  try {
    // Check if index already exists
    // const indexExists = await redis.ft.info('idx:news').catch(() => false);
    // if (indexExists) {
    //   console.log('Search index already exists');
    //   return;
    // }

    // Drop existing index if it exists (in case of schema changes)
    try {
      await redis.ft.dropIndex('idx:news');
      console.log('Dropped existing index to recreate with new schema');
    } catch (e) {
      // Index doesn't exist, that's fine
    }

    // // Get actual embedding dimension from a sample article
    // let embeddingDimension = 3072; // Default
    // try {
    //   const sampleKey = await redis.keys('news:*').then(keys => keys[0]);
    //   if (sampleKey) {
    //     const sampleArticle = await redis.json.get(sampleKey);
    //     if (sampleArticle && sampleArticle.vector) {
    //       embeddingDimension = sampleArticle.vector.length;
    //       console.log(`Detected embedding dimension: ${embeddingDimension}`);
    //     }
    //   }
    // } catch (e) {
    //   console.log('Could not detect embedding dimension, using default:', embeddingDimension);
    // }

    console.log('Creating enhanced RedisSearch index...');
    await redis.ft.create('idx:news', {
      '$.title': { 
        type: 'TEXT', 
        AS: 'title'
      },
      '$.description': { 
        type: 'TEXT', 
        AS: 'description'
      },
      '$.content': { 
        type: 'TEXT', 
        AS: 'content'
      },
      '$.summary': { 
        type: 'TEXT', 
        AS: 'summary'
      },
      '$.sentiment': { type: 'TAG', AS: 'sentiment' },
      '$.keywords': { type: 'TAG', AS: 'keywords' },
      '$.source.name': { type: 'TAG', AS: 'source' },
      '$.publishedAt': { type: 'TEXT', AS: 'publishedAt' },
      '$.category': { type: 'TAG', AS: 'category' },
      '$.id': { type: 'TAG', AS: 'article_id' },
      '$.urlToImage': { type: 'TEXT', AS: 'urlToImage' },
      '$.url': { type: 'TEXT', AS: 'url' },
      '$.vector': { 
        type: 'VECTOR', 
        AS: 'vector', 
        ALGORITHM: 'FLAT', 
        TYPE: 'FLOAT32',
        DIM: 3072, 
        DISTANCE_METRIC: 'COSINE' 
      }
    }, { 
      ON: 'JSON', 
      PREFIX: 'news:'
    });
    
    console.log('Enhanced search index created successfully');
  } catch (error) {
    if (error.message.includes('Index already exists')) {
      console.log('Search index already exists');
    } else {
      console.error('Error creating search index:', error);
    }
  }
}

async function vectorSearchSimilarNews(searchText, limit = 10, threshold = 0.7, filters = {}, excludeId = null) {
  try {
    console.log(`Searching for similar news to: "${searchText}"`);
    
    // Generate embedding for the search text using Gemini
    const searchVector = await generateEmbedding(searchText);
    
    if (!searchVector || !Array.isArray(searchVector)) {
      throw new Error('Failed to generate embedding for search text');
    }

    console.log(`Generated embedding with dimension: ${searchVector.length}`);

    // Build the vector similarity query
    let baseQuery = `*=>[KNN ${limit * 2} @vector $BLOB AS vector_score]`;
    const queryFilters = [];

    // Add filters if provided
    if (filters.category) {
      queryFilters.push(`@category:{${filters.category}}`);
    }
    if (filters.source) {
      queryFilters.push(`@source:{${filters.source}}`);
    }
    if (filters.sentiment) {
      queryFilters.push(`@sentiment:{${filters.sentiment}}`);
    }

    // Exclude specific article ID if provided
    if (excludeId) {
      queryFilters.push(`-@article_id:{${excludeId}}`);
    }

    // Combine filters with base query
    let finalQuery = baseQuery;
    if (queryFilters.length > 0) {
      finalQuery = `(${queryFilters.join(' ')})=>[KNN ${limit * 2} @vector $BLOB AS vector_score]`;
    }

    // Prepare the vector search parameters
    const vectorQuery = Buffer.from(new Float32Array(searchVector).buffer);

    // Perform vector similarity search
    const searchResults = await redis.ft.search('idx:news', finalQuery, {
      PARAMS: {
        BLOB: vectorQuery
      },
      SORTBY: {
        BY: 'vector_score',
        DIRECTION: 'ASC' // Lower scores mean higher similarity in cosine distance
      },
      RETURN: [
        'title', 'description', 'content', 'summary', 'sentiment', 'keywords',
        'source', 'publishedAt', 'category', 'article_id', 'urlToImage', 'url', 'vector_score'
      ],
      LIMIT: {
        from: 0,
        size: limit * 2 // Get more results to filter by threshold
      },
      DIALECT: 2
    });
    // console.log("Search Results", searchResults);

    // Process and filter results
    const similarArticles = [];
    
    if (searchResults && searchResults.documents) {
      for (const doc of searchResults.documents) {
        const score = parseFloat(doc.value.vector_score || 1);
        const similarity = 1 - score; // Convert distance to similarity (higher is more similar)
        // console.log(similarity);
        // Filter by similarity threshold
        if (similarity >= threshold) {
          similarArticles.push({
            id: doc.value.article_id,
            title: doc.value.title,
            description: doc.value.description,
            content: doc.value.content,
            summary: doc.value.summary,
            sentiment: doc.value.sentiment,
            source: doc.value.source,
            keywords: doc.value.keywords,
            publishedAt: doc.value.publishedAt,
            category: doc.value.category,
            urlToImage: doc.value.urlToImage,
            url: doc.value.url,
            similarity: similarity,
            distance: score
          });
        }
      }
    }

    // Sort by similarity (highest first) and limit results
    const finalResults = similarArticles
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`Found ${finalResults.length} similar articles above threshold ${threshold}`);
    // console.log("Final Results", finalResults);
    return finalResults;

  } catch (error) {
    console.error('Error in vector search:', error);
    throw error;
  }
}

async function storeUserPreferences(userId, preferences) {
  const key = `user:${userId}:preferences`;
  await redis.json.set(key, '$', {
    userId,
    preferences,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

// Get user preferences
async function getUserPreferences(userId) {
  const key = `user:${userId}:preferences`;
  const prefs = await redis.json.get(key);
  return prefs;
}

// Update user preferences
async function updateUserPreferences(userId, preferences) {
  const key = `user:${userId}:preferences`;
  const exists = await redis.exists(key);
  
  if (exists) {
    await redis.json.set(key, '$.preferences', preferences);
    await redis.json.set(key, '$.updatedAt', new Date().toISOString());
  } else {
    await storeUserPreferences(userId, preferences);
  }
}

// Get personalized news based on user preferences using vector search
// Enhanced cached personalized news function with Redis 8 features
// Simplified personalized news function using the excellent vectorSearchSimilarNews
// Store read article with TTL
async function markArticleAsRead(userId, articleId) {
  if (!userId || !articleId) return;
  
  const key = `user:${userId}:read:${articleId}`;
  await redis.setEx(key, 7200, Date.now().toString()); // Convert to string
  
  // Also add to a sorted set for easier bulk operations
  const readSetKey = `user:${userId}:read_set`;
  await redis.zAdd(readSetKey, { score: Date.now(), value: articleId });
  await redis.expire(readSetKey, 7200);
}

// Check if article is read by user
async function isArticleRead(userId, articleId) {
  if (!userId || !articleId) return false;
  
  const key = `user:${userId}:read:${articleId}`;
  const exists = await redis.exists(key);
  return exists === 1;
}

// Get all read article IDs for a user
async function getUserReadArticles(userId) {
  if (!userId) return [];
  
  const readSetKey = `user:${userId}:read_set`;
  const readArticles = await redis.zRange(readSetKey, 0, -1);
  return readArticles || [];
}

// Filter out read articles from results
async function filterReadArticles(userId, articles) {
  if (!userId || !articles || articles.length === 0) return articles;
  
  const readArticleIds = await getUserReadArticles(userId);
  if (readArticleIds.length === 0) return articles;
  
  const readSet = new Set(readArticleIds);
  return articles.filter(article => !readSet.has(article.id));
}

// Updated API route
async function getArticleById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] || req.query.userId; // Get userId from header or query
    
    const key = `news:${id}`;
    const article = await redis.json.get(key);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Mark article as read if userId is provided
    if (userId) {
      await markArticleAsRead(userId, id);
      
      // Clear personalized cache for this user since read list changed
      await clearPersonalizedCache(userId);
    }

    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
}

// Enhanced getPersonalizedNews with read filtering
async function getPersonalizedNews(userId, limit = 10, offset = 0, options = {}) {
  try {
    const {
      forceRefresh = false,
      cacheTimeout = 1800, // 30 minutes
      includeCacheStats = false
    } = options;

    // Simple cache keys
    const cacheKey = `personalized_simple:${userId}:${limit}:${offset}`;
    const prefsVersionKey = `prefs_version_simple:${userId}`;
    const statsKey = `personalized_stats_simple:${userId}`;

    // Check cache first
    if (!forceRefresh) {
      try {
        const [cachedData, prefsVersion] = await Promise.all([
          redis.json.get(cacheKey).catch(() => null),
          redis.get(prefsVersionKey).catch(() => null)
        ]);
        
        if (cachedData?.results) {
          // Validate cache with current preferences
          const userPrefs = await getUserPreferences(userId);
          const currentPrefsHash = userPrefs ? 
            require('crypto').createHash('md5').update(JSON.stringify(userPrefs.preferences)).digest('hex') : 'none';
          
          if (prefsVersion === currentPrefsHash) {
            // Filter out read articles from cached results
            const filteredResults = await filterReadArticles(userId, cachedData.results);
            
            // If significant articles were filtered out, refresh cache
            const filteredCount = cachedData.results.length - filteredResults.length;
            // if (filteredCount > limit * 0.3) { // If more than 30% filtered, refresh
            //   console.log(`Too many read articles filtered (${filteredCount}), refreshing cache`);
            // } else {
              await redis.hIncrBy(statsKey, 'cache_hits', 1);
              console.log(`Cache HIT for personalized news: ${userId} (${filteredCount} read articles filtered)`);
              
              const response = {
                articles: filteredResults.slice(offset, offset + limit),
                totalCount: filteredResults.length,
                cached: true,
                filteredReadCount: filteredCount
              };

              if (includeCacheStats) {
                const stats = await redis.hGetAll(statsKey);
                response.cacheStats = {
                  hits: parseInt(stats.cache_hits || 0),
                  misses: parseInt(stats.cache_misses || 0)
                };
              }

              return response;
            }
          
        }
      } catch (cacheError) {
        console.log('Cache check failed:', cacheError);
      }
    }

    // Cache miss or needs refresh
    await redis.hIncrBy(statsKey, 'cache_misses', 1);
    console.log(`Cache MISS for personalized news: ${userId}`);

    // Get user preferences
    const userPrefs = await getUserPreferences(userId);
    
    if (!userPrefs?.preferences?.length) {
      console.log(`No preferences for user ${userId}, using general articles`);
      const generalResult = await getAllArticles(limit + offset + 20, 0); // Get extra to account for filtering
      const filteredArticles = await filterReadArticles(userId, generalResult.articles);
      
      return {
        articles: filteredArticles.slice(offset, offset + limit),
        totalCount: filteredArticles.length,
        cached: false,
        fallback: true,
        filteredReadCount: generalResult.articles.length - filteredArticles.length
      };
    }

    const { preferences } = userPrefs;
    console.log(`Processing ${preferences.length} preferences for user ${userId}`);

    // Get articles for each preference using vectorSearchSimilarNews
    const allResults = [];
    const seenArticles = new Set();
    const articlesPerPreference = Math.ceil((limit + offset + 40) / preferences.length); // Get more to account for filtering

    for (let i = 0; i < preferences.length; i++) {
      const preference = preferences[i];
      
      try {
        console.log(`Searching for preference: "${preference}"`);
        
        const vectorResults = await vectorSearchSimilarNews(
          preference,
          limit + offset + 20, // Get more results
          0.4,
          {},
          null
        );

        const preferenceWeight = 1 - (i * 0.1);
        
        for (const article of vectorResults) {
          if (!seenArticles.has(article.id)) {
            seenArticles.add(article.id);
            allResults.push({
              ...article,
              matched_preference: preference,
              preference_order: i,
              preference_weight: preferenceWeight,
              final_score: article.similarity * preferenceWeight
            });
          }
        }
        
        console.log(`Found ${vectorResults.length} articles for "${preference}"`);
        
      } catch (error) {
        console.error(`Error searching for preference "${preference}":`, error);
      }
    }

    // Sort by final score
    let sortedResults = allResults.sort((a, b) => b.final_score - a.final_score);

    // Filter out read articles
    const originalCount = sortedResults.length;
    sortedResults = await filterReadArticles(userId, sortedResults);
    const filteredReadCount = originalCount - sortedResults.length;

    // Add general articles if we don't have enough after filtering
    let finalResults = sortedResults;
    const personalizedCount = sortedResults.length;
    
    if (sortedResults.length < limit + offset + 10) {
      const needed = (limit + offset + 15) - sortedResults.length;
      const existingIds = new Set(sortedResults.map(a => a.id));
      
      try {
        const generalResult = await getAllArticles(needed * 2, 0);
        let generalArticles = generalResult.articles
          .filter(article => !existingIds.has(article.id));
        
        // Filter read articles from general articles too
        generalArticles = await filterReadArticles(userId, generalArticles);
        
        generalArticles = generalArticles
          .slice(0, needed)
          .map(article => ({
            ...article,
            matched_preference: 'general',
            preference_order: 999,
            final_score: 0.1
          }));
        
        finalResults = [...sortedResults, ...generalArticles];
        console.log(`Added ${generalArticles.length} general articles (after read filtering)`);
      } catch (generalError) {
        console.error('Error getting general articles:', generalError);
      }
    }

    const totalCount = finalResults.length;

    // Cache the results (before read filtering for future cache hits)
    const prefsHash = require('crypto').createHash('md5').update(JSON.stringify(preferences)).digest('hex');
    
    const cacheData = {
      results: allResults.sort((a, b) => b.final_score - a.final_score), // Cache all results
      totalCount: allResults.length,
      personalizedCount: personalizedCount,
      timestamp: Date.now()
    };

    // Cache with pipeline
    const pipeline = redis.multi();
    pipeline.json.set(cacheKey, '$', cacheData);
    pipeline.expire(cacheKey, cacheTimeout);
    pipeline.set(prefsVersionKey, prefsHash, 'EX', cacheTimeout);
    await pipeline.exec();

    console.log(`Cached personalized news for user ${userId}: ${personalizedCount}/${totalCount} personalized, ${filteredReadCount} read articles filtered`);

    // Return final response
    const response = {
      articles: finalResults.slice(offset, offset + limit),
      totalCount: totalCount,
      personalizedCount: personalizedCount,
      cached: false,
      preferencesProcessed: preferences.length,
      filteredReadCount: filteredReadCount
    };

    if (includeCacheStats) {
      const stats = await redis.hGetAll(statsKey);
      response.cacheStats = {
        hits: parseInt(stats.cache_hits || 0),
        misses: parseInt(stats.cache_misses || 0)
      };
    }

    return response;

  } catch (error) {
    console.error('Error in getPersonalizedNews:', error);
    
    // Fallback to general articles with read filtering
    try {
      const generalResult = await getAllArticles(limit + offset + 10, 0);
      const filteredArticles = await filterReadArticles(userId, generalResult.articles);
      
      return {
        articles: filteredArticles.slice(offset, offset + limit),
        totalCount: filteredArticles.length,
        cached: false,
        fallback: true,
        error: error.message,
        filteredReadCount: generalResult.articles.length - filteredArticles.length
      };
    } catch (fallbackError) {
      return {
        articles: [],
        totalCount: 0,
        cached: false,
        error: `${error.message}; ${fallbackError.message}`
      };
    }
  }
}

// Enhanced getPersonalizedNewsSearch with read filtering
async function getPersonalizedNewsSearch(userId, limit = 10, offset = 0, searchQuery = '', sentiment = null, source = null, options = {}) {
  try {
    const {
      forceRefresh = false,
      cacheTimeout = 900,
      includeCacheStats = false,
      similarityThreshold = 0.3,
      personalizedLimit = Math.max(100, limit * 8)
    } = options;

    const searchParams = { q: searchQuery || '', sentiment: sentiment || '', source: source || '' };
    const searchHash = require('crypto').createHash('md5').update(JSON.stringify(searchParams)).digest('hex');
    const cacheKey = `personalized_search_simple:${userId}:${searchHash}:${limit}:${offset}`;
    const statsKey = `personalized_search_stats_simple:${userId}`;

    // Check cache first
    if (!forceRefresh) {
      try {
        const cachedData = await redis.json.get(cacheKey);
        if (cachedData?.results) {
          // Filter out read articles from cached results
          const filteredResults = await filterReadArticles(userId, cachedData.results);
          const filteredCount = cachedData.results.length - filteredResults.length;
          
          // If too many articles filtered, refresh cache
          if (filteredCount > limit * 0.3) {
            console.log(`Too many read articles in search cache (${filteredCount}), refreshing`);
          } else {
          await redis.hIncrBy(statsKey, 'cache_hits', 1);
          console.log(`Cache HIT for personalized search: ${userId} - "${searchQuery}" (${filteredCount} read filtered)`);
          
          const response = {
            articles: filteredResults.slice(offset, offset + limit),
            totalCount: filteredResults.length,
            cached: true,
            searchQuery: searchQuery,
            filters: { sentiment, source },
            filteredReadCount: filteredCount
          };

          if (includeCacheStats) {
            const stats = await redis.hGetAll(statsKey);
            response.cacheStats = {
              hits: parseInt(stats.cache_hits || 0),
              misses: parseInt(stats.cache_misses || 0)
            };
          }

          return response;
        }
        }
      } catch (cacheError) {
        console.log('Cache check failed:', cacheError);
      }
    }

    // Cache miss or needs refresh
    await redis.hIncrBy(statsKey, 'cache_misses', 1);
    console.log(`Cache MISS for personalized search: ${userId} - "${searchQuery}"`);

    // Get personalized articles with extra buffer for read filtering
    const personalizedResult = await getPersonalizedNews(
      userId, 
      personalizedLimit + 20, // Extra buffer
      0, 
      { forceRefresh, cacheTimeout: cacheTimeout * 2 }
    );

    let searchResults = personalizedResult.articles || [];

    // Apply search filtering
    if (searchQuery && searchQuery.trim()) {
      console.log(`Filtering ${searchResults.length} personalized articles for: "${searchQuery}"`);
      
      try {
        const searchVector = await generateEmbedding(searchQuery.trim());
        
        if (searchVector && Array.isArray(searchVector)) {
          const articlesWithSimilarity = [];
          
          for (const article of searchResults) {
            if (article.vector && Array.isArray(article.vector)) {
              const similarity = calculateCosineSimilarity(searchVector, article.vector);
              
              if (similarity >= similarityThreshold) {
                articlesWithSimilarity.push({
                  ...article,
                  search_similarity: similarity,
                  search_query: searchQuery.trim(),
                  search_method: 'semantic_filter'
                });
              }
            } else {
              const textContent = `${article.title || ''} ${article.description || ''} ${article.content || ''}`.toLowerCase();
              const queryWords = searchQuery.toLowerCase().split(/\s+/);
              const matchScore = queryWords.reduce((score, word) => {
                return score + (textContent.includes(word) ? 1 : 0);
              }, 0) / queryWords.length;
              
              if (matchScore > 0.3) {
                articlesWithSimilarity.push({
                  ...article,
                  search_similarity: matchScore * 0.7,
                  search_query: searchQuery.trim(),
                  search_method: 'text_filter'
                });
              }
            }
          }
          
          searchResults = articlesWithSimilarity.sort((a, b) => {
            const simDiff = (b.search_similarity || 0) - (a.search_similarity || 0);
            if (Math.abs(simDiff) > 0.1) return simDiff;
            return (b.final_score || 0) - (a.final_score || 0);
          });
          
          console.log(`Found ${searchResults.length} semantically similar articles`);
        } else {
          console.log('Failed to generate search embedding, using text fallback');
          const queryWords = searchQuery.toLowerCase().split(/\s+/);
          searchResults = searchResults.filter(article => {
            const textContent = `${article.title || ''} ${article.description || ''}`.toLowerCase();
            return queryWords.some(word => textContent.includes(word));
          }).map(article => ({
            ...article,
            search_similarity: 0.5,
            search_query: searchQuery.trim(),
            search_method: 'text_fallback'
          }));
        }
      } catch (searchError) {
        console.error('Error in semantic search filtering:', searchError);
        searchResults = searchResults.map(article => ({
          ...article,
          search_similarity: 0.3,
          search_query: searchQuery.trim(),
          search_method: 'error_fallback'
        }));
      }
    }

    // Apply additional filters
    if (sentiment || source) {
      searchResults = searchResults.filter(article => {
        if (sentiment && article.sentiment !== sentiment) return false;
        if (source && article.source !== source) return false;
        return true;
      });
    }

    const totalCount = searchResults.length;

    // Cache the results
    const cacheData = {
      results: searchResults,
      totalCount: totalCount,
      timestamp: Date.now(),
      searchQuery: searchQuery,
      filters: { sentiment, source },
      personalizedCount: personalizedResult.personalizedCount || 0
    };

    try {
      await redis.json.set(cacheKey, '$', cacheData);
      await redis.expire(cacheKey, cacheTimeout);
      console.log(`Cached personalized search results: ${userId} - "${searchQuery}" (${totalCount} articles)`);
    } catch (cacheError) {
      console.error('Failed to cache search results:', cacheError);
    }

    const response = {
      articles: searchResults.slice(offset, offset + limit),
      totalCount: totalCount,
      cached: false,
      searchQuery: searchQuery,
      filters: { sentiment, source },
      personalizedCount: personalizedResult.personalizedCount || 0,
      searchMethod: searchQuery ? 'personalized_semantic_search' : 'personalized_filtered',
      filteredReadCount: personalizedResult.filteredReadCount || 0
    };

    if (includeCacheStats) {
      const stats = await redis.hGetAll(statsKey);
      response.cacheStats = {
        hits: parseInt(stats.cache_hits || 0),
        misses: parseInt(stats.cache_misses || 0)
      };
    }

    return response;

  } catch (error) {
    console.error('Error in getPersonalizedNewsSearch:', error);
    
    try {
      const fallbackResult = await getPersonalizedNews(userId, limit + offset, 0);
      return {
        articles: fallbackResult.articles.slice(offset, offset + limit),
        totalCount: fallbackResult.totalCount || 0,
        cached: false,
        fallback: true,
        error: error.message,
        searchQuery: searchQuery,
        filters: { sentiment, source }
      };
    } catch (fallbackError) {
      return {
        articles: [],
        totalCount: 0,
        cached: false,
        error: `${error.message}; ${fallbackError.message}`,
        searchQuery: searchQuery,
        filters: { sentiment, source }
      };
    }
  }
}

// Simple cache clearing function
async function clearPersonalizedCache(userId) {
  try {
    console.log("clearPersonalizedCache", userId);
    const keys = await redis.keys(`personalized_simple:${userId}:*`);
    const versionKey = `prefs_version_simple:${userId}`;
    
    if (keys.length > 0) {
      await redis.del([...keys, versionKey]);
    }
    
    console.log(`Cleared simple personalized cache for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error clearing simple personalized cache:', error);
    return false;
  }
}

// Helper function for cosine similarity calculation
function calculateCosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper function to get all articles with filters (implement based on your needs)
async function getAllArticlesWithFilters(limit = 10, offset = 0, filters = {}) {
  try {
    // This should filter your getAllArticles function based on the provided filters
    // For now, falling back to general getAllArticles
    return await getAllArticles(limit, offset);
  } catch (error) {
    console.error('Error in getAllArticlesWithFilters:', error);
    throw error;
  }
}

// Function to clear personalized search cache for a user
async function clearPersonalizedSearchCache(userId) {
  try {
    const pattern = `personalized_search:${userId}:*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`Cleared ${keys.length} personalized search cache entries for user: ${userId}`);
    }
    
    // Also clear metadata cache
    const metaPattern = `personalized_search_meta:${userId}:*`;
    const metaKeys = await redis.keys(metaPattern);
    
    if (metaKeys.length > 0) {
      await redis.del(metaKeys);
      console.log(`Cleared ${metaKeys.length} personalized search metadata cache entries for user: ${userId}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing personalized search cache:', error);
    return false;
  }
}



// Enhanced user preferences update with cache invalidation
async function updateUserPreferences(userId, preferences) {
  try {
    const key = `user:${userId}:preferences`;
    const exists = await redis.exists(key);
    
    // Store/update preferences
    if (exists) {
      await redis.json.set(key, '$.preferences', preferences);
      await redis.json.set(key, '$.updatedAt', new Date().toISOString());
    } else {
      await storeUserPreferences(userId, preferences);
    }
    
    // Invalidate all cached personalized content for this user
    await clearPersonalizedCache(userId);
    
    console.log(`Updated preferences and cleared cache for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return false;
  }
}

// Get personalized news cache statistics
async function getPersonalizedCacheStats(userId = null) {
  try {
    const stats = {};
    
    if (userId) {
      // Get stats for specific user
      const statsKey = `personalized_stats:${userId}`;
      const userStats = await redis.hGetAll(statsKey);
      stats.user = {
        id: userId,
        hits: parseInt(userStats.cache_hits || 0),
        misses: parseInt(userStats.cache_misses || 0),
        totalRequests: parseInt(userStats.total_requests || 0),
        hitRate: userStats.total_requests ? 
          (parseInt(userStats.cache_hits || 0) / parseInt(userStats.total_requests)) * 100 : 0
      };
      
      // Check if user has active cache
      const cacheKeys = await redis.keys(`personalized:${userId}:*`);
      stats.user.activeCacheEntries = cacheKeys.length;
      
      // Get last cache timestamp
      if (cacheKeys.length > 0) {
        const metaKey = `personalized_meta:${userId}`;
        const metaData = await redis.json.get(metaKey);
        if (metaData) {
          stats.user.lastCached = new Date(metaData.timestamp);
          stats.user.cacheAge = Date.now() - metaData.timestamp;
        }
      }
    }
    
    // Get overall personalized cache stats
    const lruKey = 'personalized_cache_lru';
    const totalCached = await redis.zCard(lruKey);
    const oldestCache = await redis.zRange(lruKey, 0, 0, { WITHSCORES: true });
    const newestCache = await redis.zRange(lruKey, -1, -1, { WITHSCORES: true });
    
    stats.overall = {
      totalCachedUsers: totalCached,
      oldestCacheTime: oldestCache.length > 0 ? new Date(oldestCache[0].score) : null,
      newestCacheTime: newestCache.length > 0 ? new Date(newestCache[0].score) : null
    };
    
    // Get daily unique users served personalized content
    try {
      const today = new Date().toISOString().split('T')[0];
      const uniqueToday = await redis.pfCount(`personalized_users:${today}`);
      stats.daily = {
        date: today,
        uniqueUsersServed: uniqueToday
      };
    } catch (hllError) {
      stats.daily = { error: 'HyperLogLog not available' };
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting personalized cache stats:', error);
    return { error: error.message };
  }
}

// Clear personalized cache for specific user or all users
async function clearPersonalizedCache(userId = null, options = {}) {
  try {
    const { clearStats = false, clearFallbacks = true } = options;
    
    if (userId) {
      // Clear cache for specific user
      const patterns = [
        `personalized:${userId}:*`,
        `personalized_meta:${userId}`,
        `prefs_version:${userId}`
      ];
      
      if (clearFallbacks) {
        patterns.push(`fallback:${userId}:*`, `personalized_fallback:${userId}`);
      }
      
      let totalCleared = 0;
      
      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(keys);
          totalCleared += keys.length;
        }
      }
      
      if (clearStats) {
        await redis.del(`personalized_stats:${userId}`);
        totalCleared += 1;
      }
      
      // Remove from LRU management
      const lruKey = 'personalized_cache_lru';
      const lruKeys = await redis.zRange(lruKey, 0, -1);
      const keysToRemove = lruKeys.filter(key => key.includes(userId));
      if (keysToRemove.length > 0) {
        await redis.zRem(lruKey, keysToRemove);
      }
      
      console.log(`Cleared personalized cache for user: ${userId} (${totalCleared} keys)`);
      return { cleared: totalCleared, userId };
    } else {
      // Clear all personalized caches
      const patterns = [
        'personalized:*', 
        'personalized_meta:*', 
        'prefs_version:*', 
        'personalized_cache_lru'
      ];
      
      if (clearFallbacks) {
        patterns.push('fallback:*', 'personalized_fallback:*');
      }
      
      let totalCleared = 0;
      
      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(keys);
          totalCleared += keys.length;
        }
      }
      
      if (clearStats) {
        const statsKeys = await redis.keys('personalized_stats:*');
        if (statsKeys.length > 0) {
          await redis.del(statsKeys);
          totalCleared += statsKeys.length;
        }
      }
      
      console.log(`Cleared all personalized caches: ${totalCleared} keys`);
      return { cleared: totalCleared, scope: 'all' };
    }
  } catch (error) {
    console.error('Error clearing personalized cache:', error);
    return { error: error.message };
  }
}

// Search articles by topic using RedisSearch (with pagination)
async function searchArticlesByTopic(topic, limit = 10, offset = 0) {
  try {
    // Build proper search query for multiple fields
    const searchQuery = [
      `@title:${topic}`,
      `@description:${topic}`,
      `@content:${topic}`,
      `@summary:${topic}`,
      `@keywords:${topic}`
    ].join(' | ');
    
    const query = `(${searchQuery})`;
    
    // Get total count first
    const countResults = await redis.ft.search(
      'idx:news',
      query,
      { 
        LIMIT: { from: 0, size: 0 } // Only get count
      }
    );
    
    const totalCount = countResults.total || 0;
    
    // Get paginated results
    const results = await redis.ft.search(
      'idx:news',
      query,
      { 
        SORTBY: { BY: 'publishedAt', DIRECTION: 'DESC' }, 
        LIMIT: { from: offset, size: limit }
      }
    );
    
    return {
      articles: results.documents.map(doc => doc.value),
      totalCount
    };
  } catch (error) {
    console.error('Error searching articles:', error);
    return { articles: [], totalCount: 0 };
  }
}



// Search articles by sentiment (with pagination)
async function searchArticlesBySentiment(sentiment, limit = 10, offset = 0) {
  try {
    // Get total count first
    const countResults = await redis.ft.search(
      'idx:news',
      `@sentiment:{${sentiment}}`,
      { 
        LIMIT: { from: 0, size: 0 } // Only get count
      }
    );
    
    const totalCount = countResults.total || 0;
    
    // Get paginated results
    const results = await redis.ft.search(
      'idx:news',
      `@sentiment:{${sentiment}}`,
      { 
        SORTBY: { BY: 'publishedAt', DIRECTION: 'DESC' }, 
        LIMIT: { from: offset, size: limit } 
      }
    );
    
    return {
      articles: results.documents.map(doc => doc.value),
      totalCount
    };
  } catch (error) {
    console.error('Error searching articles by sentiment:', error);
    return { articles: [], totalCount: 0 };
  }
}

// Enhanced similarity search using Redis 8 features with advanced caching
async function findSimilarArticles(articleId, limit = 6, offset = 0, options = {}) {
  try {
    const {
      forceRefresh = false,
      cacheTimeout = 3600, // 1 hour default
      includeCacheStats = false,
      enablePipeline = true
    } = options;
    
    // Generate cache key with parameters for better granularity
    const cacheKey = `similar:${articleId}:${limit}:${offset}`;
    const metaCacheKey = `similar_meta:${articleId}`;
    const statsKey = `similar_stats:${articleId}`;

    // Check if article exists using Redis 8's improved EXISTS with pipeline
    let pipeline = enablePipeline ? redis.multi() : null;
    
    if (!forceRefresh) {
      if (enablePipeline) {
        // Use pipeline for batch cache check
        pipeline.json.get(cacheKey);
        pipeline.json.get(metaCacheKey);
        
        try {
          const results = await pipeline.exec();
          
          // Safely extract results, handling null/error cases
          const cachedResults = results && results[0] && results[0][0] === null ? results[0][1] : null;
          const metaData = results && results[1] && results[1][0] === null ? results[1][1] : null;
          
          if (cachedResults && metaData && cachedResults.results) {
            // Update cache hit statistics
            await redis.hIncrBy(statsKey, 'cache_hits', 1);
            await redis.hIncrBy(statsKey, 'total_requests', 1);
            await redis.expire(statsKey, cacheTimeout);

            console.log(`Cache HIT for similar articles: ${articleId}`);
            
            const response = {
              articles: cachedResults.results.slice(offset, offset + limit),
              totalCount: metaData.totalCount,
              cached: true,
              cacheAge: Date.now() - metaData.timestamp
            };

            if (includeCacheStats) {
              const stats = await redis.hGetAll(statsKey);
              response.cacheStats = {
                hits: parseInt(stats.cache_hits || 0),
                misses: parseInt(stats.cache_misses || 0),
                hitRate: stats.cache_hits ? (parseInt(stats.cache_hits) / parseInt(stats.total_requests || 1)) * 100 : 0
              };
            }

            return response;
          }
        } catch (pipelineError) {
          console.log('Pipeline cache check failed, falling back to individual calls:', pipelineError);
          // Fall through to non-pipeline approach
        }
      }
      
      // Non-pipeline approach or fallback
      try {
        const [cachedResults, metaData] = await Promise.all([
          redis.json.get(cacheKey).catch(() => null),
          redis.json.get(metaCacheKey).catch(() => null)
        ]);
        
        if (cachedResults && metaData && cachedResults.results) {
          await redis.hIncrBy(statsKey, 'cache_hits', 1);
          await redis.hIncrBy(statsKey, 'total_requests', 1);
          await redis.expire(statsKey, cacheTimeout);
          
          console.log(`Cache HIT for similar articles: ${articleId}`);
          
          const response = {
            articles: cachedResults.results.slice(offset, offset + limit),
            totalCount: metaData.totalCount,
            cached: true,
            cacheAge: Date.now() - metaData.timestamp
          };

          if (includeCacheStats) {
            const stats = await redis.hGetAll(statsKey);
            response.cacheStats = {
              hits: parseInt(stats.cache_hits || 0),
              misses: parseInt(stats.cache_misses || 0),
              hitRate: stats.total_requests ? (parseInt(stats.cache_hits || 0) / parseInt(stats.total_requests)) * 100 : 0
            };
          }

          return response;
        }
      } catch (cacheError) {
        console.log('Cache check failed:', cacheError);
        // Continue to cache miss logic
      }
    }

    // Cache miss - update statistics
    await redis.hIncrBy(statsKey, 'cache_misses', 1);
    await redis.hIncrBy(statsKey, 'total_requests', 1);
    await redis.expire(statsKey, cacheTimeout);

    console.log(`Cache MISS for similar articles: ${articleId}`);

    // Get the target article using Redis 8's improved JSON operations
    const articleKey = `news:${articleId}`;
    const targetArticle = await redis.json.get(articleKey);
    
    if (!targetArticle) {
      console.log('Article not found:', articleId);
      return { articles: [], totalCount: 0, cached: false };
    }

    // Determine search strategy
    const keywords = targetArticle.keywords || [];
    let searchText;
    let searchMethod = 'vector';
    
    if (keywords.length === 0) {
      console.log('No keywords found in article, using title as fallback');
      searchText = targetArticle.title;
    } else {
      searchText = keywords.join(' ');
      console.log(`Searching with stored keywords: ${searchText}`);
    }
    
    let similarArticles = [];
    let totalCount = 0;

    // Primary: Vector search with Redis 8's enhanced vector operations
    try {
      const vectorResults = await vectorSearchSimilarNews(
        searchText, 
        limit + offset + 20, // Get more for better caching
        0.5, 
        {}, 
        articleId
      );
      
      similarArticles = vectorResults.map(article => ({
        ...article,
        similarity_score: article.similarity,
        search_method: 'vector',
        keywords_used: keywords.length > 0 ? keywords : [targetArticle.title]
      }));
      
      totalCount = vectorResults.length;
      
    } catch (vectorError) {
      console.error('Vector search failed, falling back to text-based similarity:', vectorError);
      searchMethod = 'text';
      
      // Fallback to text-based methods
      const strategies = await Promise.allSettled([
        advancedTextSimilarity(targetArticle, limit + offset + 20),
        semanticSimilarity(targetArticle, limit + offset + 20),
        categoryBasedSimilarity(targetArticle, limit + offset + 20),
        temporalSimilarity(targetArticle, limit + offset + 20)
      ]);

      const combinedResults = await combineAndRankSimilarity(
        strategies.filter(s => s.status === 'fulfilled').map(s => s.value),
        targetArticle.id,
        limit + offset + 20,
        0
      );

      similarArticles = combinedResults.articles || [];
      totalCount = combinedResults.totalCount || 0;
    }

    // Cache the results using Redis 8's improved caching with multiple strategies
    const cacheData = {
      results: similarArticles,
      timestamp: Date.now(),
      searchMethod: searchMethod,
      articleId: articleId,
      version: '1.0'
    };

    const metaData = {
      totalCount: totalCount,
      timestamp: Date.now(),
      searchMethod: searchMethod,
      lastUpdated: new Date().toISOString()
    };

    // Use Redis 8's pipeline for efficient bulk operations
    const cachePipeline = redis.multi();
    
    // Store main cache data with compression hint
    cachePipeline.json.set(cacheKey, '$', cacheData);
    cachePipeline.expire(cacheKey, cacheTimeout);
    
    // Store metadata separately for quick access
    cachePipeline.json.set(metaCacheKey, '$', metaData);
    cachePipeline.expire(metaCacheKey, cacheTimeout);
    
    // Use Redis 8's sorted sets for LRU-style cache management
    const cacheManagementKey = `similar_cache_lru`;
    cachePipeline.zAdd(cacheManagementKey, {
      score: Date.now(),
      value: cacheKey
    });
    
    // Keep only the most recent 1000 cached similar article sets
    cachePipeline.zRemRangeByRank(cacheManagementKey, 0, -1001);
    cachePipeline.expire(cacheManagementKey, cacheTimeout * 24); // Keep management key longer
    
    // Execute all cache operations
    await cachePipeline.exec();

    // Use Redis 8's HyperLogLog for unique visitor tracking
    try {
      await redis.pfAdd(`similar_unique_articles:${new Date().toISOString().split('T')[0]}`, articleId);
    } catch (hllError) {
      console.log('HyperLogLog tracking failed:', hllError);
    }

    console.log(`Cached similar articles for: ${articleId} (${similarArticles.length} articles)`);

    // Prepare response
    const response = {
      articles: similarArticles.slice(offset, offset + limit),
      totalCount: totalCount,
      cached: false,
      searchMethod: searchMethod,
      processingTime: Date.now() - cacheData.timestamp
    };

    if (includeCacheStats) {
      const stats = await redis.hGetAll(statsKey);
      response.cacheStats = {
        hits: parseInt(stats.cache_hits || 0),
        misses: parseInt(stats.cache_misses || 0),
        hitRate: stats.total_requests ? (parseInt(stats.cache_hits || 0) / parseInt(stats.total_requests)) * 100 : 0
      };
    }

    return response;

  } catch (error) {
    console.error('Error in cached findSimilarArticles:', error);
    
    // Error fallback - try to return any available cached data
    try {
      const fallbackKey = `similar:${articleId}:fallback`;
      const fallbackData = await redis.json.get(fallbackKey);
      if (fallbackData) {
        console.log('Returning fallback cached data due to error');
        return {
          articles: fallbackData.results.slice(offset, offset + limit),
          totalCount: fallbackData.totalCount || 0,
          cached: true,
          fallback: true,
          error: error.message
        };
      }
    } catch (fallbackError) {
      console.error('Fallback cache also failed:', fallbackError);
    }
    
    // Final fallback - return basic article info
    return {
      articles: [],
      totalCount: 0,
      cached: false,
      error: error.message,
      fallback: true
    };
  }
}

// Utility function to get cache statistics and health
async function getSimilarArticleCacheStats(articleId = null) {
  try {
    const stats = {};
    
    if (articleId) {
      // Get stats for specific article
      const statsKey = `similar_stats:${articleId}`;
      const articleStats = await redis.hGetAll(statsKey);
      stats.article = {
        id: articleId,
        hits: parseInt(articleStats.cache_hits || 0),
        misses: parseInt(articleStats.cache_misses || 0),
        totalRequests: parseInt(articleStats.total_requests || 0),
        hitRate: articleStats.total_requests ? 
          (parseInt(articleStats.cache_hits || 0) / parseInt(articleStats.total_requests)) * 100 : 0
      };
    }
    
    // Get overall cache management stats
    const lruKey = 'similar_cache_lru';
    const totalCached = await redis.zCard(lruKey);
    const oldestCache = await redis.zRange(lruKey, 0, 0, { WITHSCORES: true });
    const newestCache = await redis.zRange(lruKey, -1, -1, { WITHSCORES: true });
    
    stats.overall = {
      totalCachedArticles: totalCached,
      oldestCacheTime: oldestCache.length > 0 ? new Date(oldestCache[0].score) : null,
      newestCacheTime: newestCache.length > 0 ? new Date(newestCache[0].score) : null
    };
    
    // Get daily unique articles processed using HyperLogLog
    try {
      const today = new Date().toISOString().split('T')[0];
      const uniqueToday = await redis.pfCount(`similar_unique_articles:${today}`);
      stats.daily = {
        date: today,
        uniqueArticlesProcessed: uniqueToday
      };
    } catch (hllError) {
      stats.daily = { error: 'HyperLogLog not available' };
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { error: error.message };
  }
}

// Function to clear cache for specific article or all similar article caches
async function clearSimilarArticleCache(articleId = null, options = {}) {
  try {
    const { clearStats = false, clearBloom = false } = options;
    
    if (articleId) {
      // Clear cache for specific article
      const pattern = `similar:${articleId}:*`;
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(keys);
      }
      
      // Clear metadata
      await redis.del(`similar_meta:${articleId}`);
      
      if (clearStats) {
        await redis.del(`similar_stats:${articleId}`);
      }
      
      if (clearBloom) {
        await redis.del(`similar_bloom:${articleId}`);
      }
      
      // Remove from LRU management
      const lruKey = 'similar_cache_lru';
      const lruKeys = await redis.zRange(lruKey, 0, -1);
      const keysToRemove = lruKeys.filter(key => key.includes(articleId));
      if (keysToRemove.length > 0) {
        await redis.zRem(lruKey, keysToRemove);
      }
      
      console.log(`Cleared cache for article: ${articleId}`);
      return { cleared: keys.length + 1, articleId };
    } else {
      // Clear all similar article caches
      const patterns = ['similar:*', 'similar_meta:*', 'similar_cache_lru'];
      let totalCleared = 0;
      
      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(keys);
          totalCleared += keys.length;
        }
      }
      
      if (clearStats) {
        const statsKeys = await redis.keys('similar_stats:*');
        if (statsKeys.length > 0) {
          await redis.del(statsKeys);
          totalCleared += statsKeys.length;
        }
      }
      
      if (clearBloom) {
        const bloomKeys = await redis.keys('similar_bloom:*');
        if (bloomKeys.length > 0) {
          await redis.del(bloomKeys);
          totalCleared += bloomKeys.length;
        }
      }
      
      console.log(`Cleared all similar article caches: ${totalCleared} keys`);
      return { cleared: totalCleared, scope: 'all' };
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    return { error: error.message };
  }
}

// Advanced text similarity using Redis FT.SEARCH with scoring
async function advancedTextSimilarity(targetArticle, limit) {
  try {
    const searchTerms = extractEnhancedKeywords(
      `${targetArticle.title} ${targetArticle.summary || ''} ${targetArticle.description || ''}`
    );

    if (searchTerms.length === 0) return [];

    // Build simpler query that works with Redis node client
    const queryParts = searchTerms.map(term => {
      // Escape special characters and use simpler syntax
      const escapedTerm = term.replace(/[^\w\s]/g, '');
      return `@title|summary|description|keywords:(${escapedTerm})`;
    });

    const query = `(${queryParts.join(' | ')}) -@article_id:{${targetArticle.id}}`;

    const results = await redis.ft.search(
      'idx:news',
      query,
      {
        SORTBY: { BY: 'publishedAt', DIRECTION: 'DESC' },
        LIMIT: { from: 0, size: limit }
      }
    );
    console.log("advanced text similarity", results.documents.length);
    return results.documents.map((doc, index) => ({
      ...doc.value,
      similarity_score: 1.0 - (index / results.documents.length), // Simple relevance scoring
      similarity_type: 'text'
    }));
  } catch (error) {
    console.error('Error in advanced text similarity:', error);
    return [];
  }
}

// Semantic similarity using RedisSearch aggregation
async function semanticSimilarity(targetArticle, limit) {
  try {
    // Create semantic fingerprint using key phrases
    const semanticTerms = extractSemanticTerms(targetArticle);
    
    if (semanticTerms.length === 0) return [];

    // Use simpler FT.SEARCH instead of FT.AGGREGATE for better compatibility
    const escapedTerms = semanticTerms.map(term => 
      term.replace(/[^\w\s]/g, '').split(' ').join(' ')
    ).filter(term => term.length > 0);

    if (escapedTerms.length === 0) return [];

    const query = `(@title|summary|description|keywords:(${escapedTerms.join(' | ')})) -@article_id:{${targetArticle.id}}`;

    const results = await redis.ft.search(
      'idx:news',
      query,
      {
        SORTBY: { BY: 'publishedAt', DIRECTION: 'DESC' },
        LIMIT: { from: 0, size: limit }
      }
    );
    console.log("semantic similarity", results.documents.length);
    return results.documents.map((doc, index) => ({
      ...doc.value,
      similarity_score: Math.max(0.1, 1.0 - (index / results.documents.length)),
      similarity_type: 'semantic'
    }));
  } catch (error) {
    console.error('Error in semantic similarity:', error);
    return [];
  }
}

// Category-based similarity with sentiment weighting
async function categoryBasedSimilarity(targetArticle, limit) {
  try {
    let query = '*';
    const filters = [];

    // Same sentiment gets higher score
    if (targetArticle.sentiment) {
      filters.push(`@sentiment:{${targetArticle.sentiment}}`);
    }

    // Same source gets moderate score
    if (targetArticle.source?.name) {
      filters.push(`@source:{${targetArticle.source.name}}`);
    }

    if (filters.length > 0) {
      query = filters.join(' | ');
    }

    query += ` -@article_id:{${targetArticle.id}}`;

    const results = await redis.ft.search(
      'idx:news',
      query,
      {
        SORTBY: { BY: 'publishedAt', DIRECTION: 'DESC' },
        LIMIT: { from: 0, size: limit },
        SCORER: 'DISMAX'
      }
    );
    console.log("category similarity", results.documents.length);
    return results.documents.map(doc => ({
      ...doc.value,
      similarity_score: calculateCategoryScore(targetArticle, doc.value),
      similarity_type: 'category'
    }));
  } catch (error) {
    console.error('Error in category similarity:', error);
    return [];
  }
}

// Temporal similarity - articles from similar time period
async function temporalSimilarity(targetArticle, limit) {
  try {
    const targetDate = new Date(targetArticle.publishedAt);
    const daysBefore = 7;
    const daysAfter = 7;
    
    // Create date range strings in a simpler format
    const startDate = new Date(targetDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);
    const endDate = new Date(targetDate.getTime() + daysAfter * 24 * 60 * 60 * 1000);

    // Use a simpler approach - search all and filter by date
    const results = await redis.ft.search(
      'idx:news',
      `* -@article_id:{${targetArticle.id}}`,
      {
        SORTBY: { BY: 'publishedAt', DIRECTION: 'DESC' },
        LIMIT: { from: 0, size: limit } // Get more to filter
      }
    );

    // Filter by date range and calculate temporal score
    const filteredResults = results.documents
      .map(doc => {
        const articleDate = new Date(doc.value.publishedAt);
        const isInRange = articleDate >= startDate && articleDate <= endDate;
        return {
          ...doc.value,
          similarity_score: isInRange ? calculateTemporalScore(targetDate, articleDate) : 0,
          similarity_type: 'temporal',
          inRange: isInRange
        };
      })
      .filter(article => article.inRange)
      .slice(0, limit);

    return filteredResults;
  } catch (error) {
    console.error('Error in temporal similarity:', error);
    return [];
  }
}

// Combine and rank similarity results using Redis sorted sets (with pagination)
async function combineAndRankSimilarity(strategyResults, targetId, limit, offset) {
  try {
    const tempKey = `temp:similarity:${targetId}:${Date.now()}`;
    
    // Weight different similarity types
    const weights = {
      text: 0.4,
      semantic: 0.3,
      category: 0.2,
      temporal: 0.1
    };

    // Collect all articles with weighted scores
    const articleScores = new Map();
    
    for (const results of strategyResults) {
      for (const article of results) {
        if (article.id && article.id !== targetId) {
          const weight = weights[article.similarity_type] || 0.1;
          const weightedScore = (article.similarity_score || 0) * weight;
          
          const currentScore = articleScores.get(article.id) || 0;
          articleScores.set(article.id, currentScore + weightedScore);
        }
      }
    }

    const totalCount = articleScores.size;

    // Add all results to a temporary sorted set
    if (articleScores.size > 0) {
      const scoreMembers = Array.from(articleScores.entries()).map(([id, score]) => ({
        score: score,
        value: id
      }));
      
      await redis.zAdd(tempKey, scoreMembers);
      
      // Get paginated results by combined score
      const topIds = await redis.zRangeByScore(tempKey, '-inf', '+inf', {
        REV: true,
        LIMIT: { offset: offset, count: limit }
      });
      
      // Clean up temporary key
      await redis.del(tempKey);

      // Fetch full article data
      const similarArticles = [];
      for (const articleId of topIds) {
        const article = await redis.json.get(`news:${articleId}`);
        if (article) {
          // Find the article in strategy results to get similarity info
          const found = strategyResults.flat().find(a => a.id === articleId);
          similarArticles.push({
            ...article,
            similarity_score: articleScores.get(articleId) || 0,
            similarity_type: found?.similarity_type || 'combined'
          });
        }
      }

      return { articles: similarArticles, totalCount };
    }
    
    return { articles: [], totalCount: 0 };
  } catch (error) {
    console.error('Error combining similarity results:', error);
    // Fallback to first strategy result with pagination
    const firstResults = strategyResults[0] || [];
    const paginatedResults = firstResults.slice(offset, offset + limit);
    return { articles: paginatedResults, totalCount: firstResults.length };
  }
}

// Enhanced keyword extraction with NLP-like features
function extractEnhancedKeywords(text) {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !isStopWord(word));

  // Create n-grams for better semantic matching
  const unigrams = words.slice(0, 8);
  const bigrams = [];
  
  for (let i = 0; i < words.length - 1 && bigrams.length < 4; i++) {
    if (!isStopWord(words[i]) && !isStopWord(words[i + 1])) {
      bigrams.push(`${words[i]} ${words[i + 1]}`);
    }
  }

  return [...unigrams, ...bigrams];
}

// Extract semantic terms (named entities, important phrases)
function extractSemanticTerms(article) {
  const text = `${article.title} ${article.summary || ''} ${article.description || ''}`;
  
  // Look for capitalized words (potential named entities)
  const namedEntities = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  
  // Look for quoted text
  const quotes = text.match(/"([^"]+)"/g) || [];
  
  // Technical terms (words with numbers, hyphens, etc.)
  const technicalTerms = text.match(/\b\w*[A-Z]\w*\b|\b\w+-\w+\b|\b\w*\d+\w*\b/g) || [];
  
  return [...new Set([...namedEntities, ...quotes, ...technicalTerms])].slice(0, 10);
}

// Calculate category-based similarity score
function calculateCategoryScore(target, candidate) {
  let score = 0;
  
  if (target.sentiment === candidate.sentiment) score += 0.3;
  if (target.source?.name === candidate.source?.name) score += 0.2;
  if (target.category === candidate.category) score += 0.3;
  
  return score;
}

// Calculate temporal similarity score
function calculateTemporalScore(targetDate, candidateDate) {
  const diffMs = Math.abs(targetDate.getTime() - candidateDate.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  // Closer dates get higher scores
  return Math.max(0, 1 - (diffDays / 30)); // Normalize to 30 days
}

// Enhanced stop words list
function isStopWord(word) {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'this', 'that', 'have', 'will', 'from', 'they', 
    'been', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 
    'could', 'other', 'than', 'first', 'very', 'after', 'where', 'most', 'over', 
    'even', 'much', 'make', 'before', 'great', 'back', 'through', 'years', 'should', 
    'well', 'people', 'down', 'just', 'because', 'good', 'those', 'feel', 'seem', 
    'how', 'high', 'too', 'place', 'little', 'world', 'still', 'nation', 'hand', 
    'life', 'tell', 'write', 'become', 'here', 'show', 'house', 'both', 'between', 
    'need', 'mean', 'call', 'develop', 'under', 'last', 'right', 'move', 'thing', 
    'general', 'school', 'never', 'same', 'another', 'begin', 'while', 'number', 
    'part', 'turn', 'real', 'leave', 'might', 'want', 'point', 'form', 'child', 
    'small', 'since', 'against', 'late', 'hard', 'major', 'example', 'hear', 'talk', 
    'report', 'today', 'bring', 'tomorrow', 'carry', 'clear', 'above', 'news', 'article'
  ]);
  
  return stopWords.has(word);
}

// Enhanced fallback method with better Redis utilization (with pagination)
async function fallbackSimilarSearch(articleId, limit = 6, offset = 0) {
  try {
    const key = `news:${articleId}`;
    const targetArticle = await redis.json.get(key);
    
    if (!targetArticle) return { articles: [], totalCount: 0 };

    // Extract keywords and create multiple search queries
    const keywords = extractEnhancedKeywords(targetArticle.title + ' ' + (targetArticle.summary || ''));
    
    if (keywords.length > 0) {
      const query = keywords.slice(0, 5).map(keyword => 
        `@title|summary:(${keyword}~1)`
      ).join(' | ');
      
      // Get total count
      const countResults = await redis.ft.search(
        'idx:news',
        `(${query}) -@article_id:{${articleId}}`,
        { 
          LIMIT: { from: 0, size: 0 }
        }
      );
      
      const totalCount = countResults.total || 0;
      
      // Get paginated results
      const results = await redis.ft.search(
        'idx:news',
        `(${query}) -@article_id:{${articleId}}`,
        { 
          SORTBY: { BY: '__score', DIRECTION: 'DESC' }, 
          LIMIT: { from: offset, size: limit },
          SCORER: 'BM25'
        }
      );
      
      return {
        articles: results.documents.map(doc => doc.value),
        totalCount
      };
    }
    
    return { articles: [], totalCount: 0 };
  } catch (error) {
    console.error('Error in fallback similar search:', error);
    return { articles: [], totalCount: 0 };
  }
}

// Get all articles (optimized with Redis SCAN and pagination)
async function getAllArticles(limit = 10, offset = 0) {
  // Check cache first
  const cacheKey = `all_articles:${limit}:${offset}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log("cached");
      return JSON.parse(cached);
    }

    // If not in cache, fetch from Redis search
    const countResults = await redis.ft.search(
      'idx:news',
      '*',
      {
        LIMIT: { from: 0, size: 0 } // Only get count
      }
    );
    
    const totalCount = countResults.total || 0;
    
    // Use FT.SEARCH with pagination for better performance
    const results = await redis.ft.search(
      'idx:news',
      '*',
      {
        SORTBY: { BY: 'publishedAt', DIRECTION: 'DESC' },
        LIMIT: { from: offset, size: limit }
      }
    );
    
    const response = {
      articles: results.documents.map(doc => doc.value),
      totalCount
    };

    // Cache the results for 5 minutes
    await redis.set(cacheKey, JSON.stringify(response), 'EX', 300);
    await redis.expire(cacheKey, 300);
    return response;

  } catch (error) {
    console.error('Error getting all articles:', error);
    
    // Fallback to original method with pagination
    try {
      const keys = await redis.keys('news:*');
      const totalCount = keys.length;
      
      if (keys.length === 0) {
        return { articles: [], totalCount: 0 };
      }

      // Apply pagination to keys
      const paginatedKeys = keys.slice(offset, offset + limit);
      
      const articles = [];
      const pipeline = redis.multi();
      
      paginatedKeys.forEach(key => {
        pipeline.json.get(key);
      });
      
      const results = await pipeline.exec();
      
      results.forEach((result, index) => {
        if (result[1]) {
          articles.push(result[1]);
        }
      });

      // Sort by published date
      articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      
      const response = { articles, totalCount };

      // Cache fallback results for 5 minutes
      await redis.set(cacheKey, JSON.stringify(response), 'EX', 300);

      return response;
    } catch (fallbackError) {
      console.error('Error in fallback getAllArticles:', fallbackError);
      return { articles: [], totalCount: 0 };
    }
  }
}


async function getAllSources() {
  try {
    const test = await redis.ft.search('idx:news', '@source:{GlobeNewswire}', {
      DIALECT: 2
    });
    
    console.log(test.total);
    const results = await redis.ft.aggregate('idx:news', '*', {
      GROUPBY: ['@source'],
      LOAD: ['@source'],        // <- REQUIRED to actually return grouped field
      DIALECT: 2
    });

    const sources = [];

    if (results && results.rows) {
      for (const row of results.rows) {
        const source = row?.value?.source;
        if (source && typeof source === 'string') {
          sources.push(source);
        }
      }
    }

    console.log(`Found ${sources.length} unique sources`);
    return [...new Set(sources)].sort(); // deduplicate and sort alphabetically
  } catch (error) {
    console.error('Error fetching sources:', error);
    return [];
  }
}

// Search news with custom query (with pagination)
async function searchNewsWithQuery(query, sentiment, source, limit = 10, offset = 0) {
  try {
    // Build query parts for regular search
    const queryParts = [];
    
    if (query) {
      // Search in multiple fields with OR logic
      const searchQuery = [
        `@title:${query}`,
        `@description:${query}`,
        `@content:${query}`,
        `@summary:${query}`,
        `@keywords:${query}`,
      ].join(' | ');
      queryParts.push(`(${searchQuery})`);
    }
    
    if (sentiment) {
      queryParts.push(`@sentiment:{${sentiment}}`);
    }
    
    if (source) {
      queryParts.push(`@source:{${source}}`);
    }
    
    // Combine all query parts with AND logic
    const finalQuery = queryParts.join(' ');
    
    // Get total count first
    const countResults = await redis.ft.search(
      'idx:news',
      finalQuery,
      { 
        LIMIT: { from: 0, size: 0 } // Only get count
      }
    );
    
    const totalCount = countResults.total || 0;
    
    // Get paginated results
    const results = await redis.ft.search(
      'idx:news',
      finalQuery,
      { 
        SORTBY: { BY: 'publishedAt', DIRECTION: 'DESC' }, 
        LIMIT: { from: offset, size: limit } 
      }
    );

    const articles = results.documents.map(doc => doc.value);
    
    return {
      articles,
      totalCount
    };
  } catch (error) {
    console.error('Error searching news with query:', error);
    return { articles: [], totalCount: 0 };
  }
}

// Search news with topic intersection
async function searchNewsWithTopicIntersection(query, sentiment, source, topic, limit = 10, offset = 0) {
  try {
    // Build search query (excluding topic)
    const queryParts = [];
    
    if (query) {
      const searchQuery = [
        `@title:${query}`,
        `@description:${query}`,
        `@content:${query}`,
        `@summary:${query}`,
        `@keywords:${query}`,
      ].join(' | ');
      queryParts.push(`(${searchQuery})`);
    }
    
    if (sentiment) {
      queryParts.push(`@sentiment:{${sentiment}}`);
    }
    
    if (source) {
      queryParts.push(`@source:{${source}}`);
    }
    
    const searchQuery = queryParts.length > 0 ? queryParts.join(' ') : '*';
    
    // Get all search results (we need all for intersection)
    const searchResults = await redis.ft.search(
      'idx:news',
      searchQuery,
      { 
        SORTBY: { BY: 'publishedAt', DIRECTION: 'DESC' },
        LIMIT: { from: 0, size: 1000 } // Get more results for better intersection
      }
    );
    
    // Get all topic results
    const topicResults = await searchArticlesByTopic(topic, 1000, 0);
    
    // Create sets for efficient intersection
    const searchIds = new Set(searchResults.documents.map(doc => doc.value.id));
    const topicIds = new Set(topicResults.articles.map(article => article.id));
    
    // Find intersection
    const intersectionIds = new Set();
    for (const id of searchIds) {
      if (topicIds.has(id)) {
        intersectionIds.add(id);
      }
    }
    
    // Convert back to full articles and sort by publishedAt
    const intersectionArticles = searchResults.documents
      .map(doc => doc.value)
      .filter(article => intersectionIds.has(article.id))
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    // Apply pagination to intersection results
    const totalCount = intersectionArticles.length;
    const paginatedArticles = intersectionArticles.slice(offset, offset + limit);
    
    return {
      articles: paginatedArticles,
      totalCount
    };
  } catch (error) {
    console.error('Error in search with topic intersection:', error);
    return { articles: [], totalCount: 0 };
  }
}

// Comprehensive search function that handles all search scenarios
async function searchNews(filters, pagination) {
  try {
    const { q, sentiment, source, topic } = filters;
    const { page, limit, offset } = pagination;
    
    // Handle different filter combinations
    const hasSearchFilters = q || sentiment || source;
    const hasTopic = topic;
    
    // Case 1: Only topic is present - use topic search
    if (hasTopic && !hasSearchFilters) {
      return await searchArticlesByTopic(topic, limit, offset);
    }
    
    // Case 2: Both topic and search filters are present - use intersection approach
    if (hasTopic && hasSearchFilters) {
      return await searchNewsWithTopicIntersection(q, sentiment, source, topic, limit, offset);
    }
    
    // Case 3: Only search filters are present (no topic) - use regular search
    if (hasSearchFilters && !hasTopic) {
      return await searchNewsWithQuery(q, sentiment, source, limit, offset);
    }
    
    // Case 4: No filters provided - return all articles
    return await getAllArticles(limit, offset);
  } catch (error) {
    console.error('Error in comprehensive search:', error);
    return { articles: [], totalCount: 0 };
  }
}

// Article metrics tracking functions
async function trackArticleMetrics(articleId, userId, metadata = {}) {
  try {
    const timestamp = Date.now();
    const dateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Generate metric keys
    const totalViewsKey = `article_views:${articleId}`;
    const uniqueViewsKey = `article_unique_views:${articleId}`;
    const userViewsKey = `article_user_views:${articleId}`;
    const dailyViewsKey = `article_daily_views:${articleId}:${dateKey}`;
    const engagementKey = `article_engagement:${articleId}`;
    const lastViewedKey = `article_last_viewed:${articleId}`;
    
    // Execute operations and get values directly for reliability
    const [totalViewsResult, dailyViewsResult] = await Promise.all([
      redis.incr(totalViewsKey),
      redis.hIncrBy(dailyViewsKey, 'views', 1)
    ]);
    
    console.log('Total views result:', totalViewsResult);
    console.log('Daily views result:', dailyViewsResult);
    
    // Use pipeline for other operations (non-critical for return values)
    const pipeline = redis.multi();
    
    // Track unique views (by IP address)
    const ipHash = metadata.ipAddress ? 
      require('crypto').createHash('md5').update(metadata.ipAddress).digest('hex') : 
      'unknown';
    pipeline.sAdd(uniqueViewsKey, ipHash);
    
    // Track user-specific views (if userId provided)
    if (userId) {
      pipeline.sAdd(userViewsKey, userId);
      pipeline.hSet(`user_article_views:${userId}`, articleId, timestamp);
    }
    
    // Set expiration for daily views
    pipeline.expire(dailyViewsKey, 86400 * 30); // 30 days
    
    // Track engagement metrics
    const engagementData = {
      timestamp,
      userAgent: metadata.userAgent || 'unknown',
      referrer: metadata.referrer || 'direct',
      language: metadata.language || 'unknown',
      userId: userId || 'anonymous'
    };
    pipeline.lPush(engagementKey, JSON.stringify(engagementData));
    pipeline.lTrim(engagementKey, 0, 999); // Keep last 1000 engagement records
    pipeline.expire(engagementKey, 86400 * 7); // 7 days
    
    // Update last viewed timestamp
    pipeline.set(lastViewedKey, timestamp);
    
    // Execute remaining operations
    await pipeline.exec();
    
    const totalViews = totalViewsResult;
    const dailyViews = dailyViewsResult;
    
    const uniqueViewsCount = await redis.sCard(uniqueViewsKey);
    const userViewsCount = userId ? await redis.sCard(userViewsKey) : 0;
    
    // Calculate engagement score (based on recent activity)
    const recentEngagement = await redis.lRange(engagementKey, 0, 9); // Last 10 interactions
    const engagementScore = recentEngagement.length;
    
    const metrics = {
      totalViews,
      uniqueViews: uniqueViewsCount,
      userViews: userViewsCount,
      dailyViews,
      engagement: engagementScore,
      lastViewed: timestamp
    };
    
    console.log('Final metrics object:', JSON.stringify(metrics, null, 2));
    
    return metrics;
    
  } catch (error) {
    console.error('Error tracking article metrics:', error);
    return {
      totalViews: 0,
      uniqueViews: 0,
      userViews: 0,
      dailyViews: 0,
      engagement: 0,
      lastViewed: Date.now()
    };
  }
}

// Get article metrics
async function getArticleMetrics(articleId) {
  try {
    const dateKey = new Date().toISOString().split('T')[0];
    
    const totalViewsKey = `article_views:${articleId}`;
    const uniqueViewsKey = `article_unique_views:${articleId}`;
    const userViewsKey = `article_user_views:${articleId}`;
    const dailyViewsKey = `article_daily_views:${articleId}:${dateKey}`;
    const engagementKey = `article_engagement:${articleId}`;
    const lastViewedKey = `article_last_viewed:${articleId}`;
    
    // Get all metrics in parallel
    const [
      totalViews,
      uniqueViewsCount,
      userViewsCount,
      dailyViews,
      lastViewed,
      recentEngagement
    ] = await Promise.all([
      redis.get(totalViewsKey).then(val => parseInt(val) || 0),
      redis.sCard(uniqueViewsKey),
      redis.sCard(userViewsKey),
      redis.hGet(dailyViewsKey, 'views').then(val => parseInt(val) || 0),
      redis.get(lastViewedKey).then(val => parseInt(val) || 0),
      redis.lRange(engagementKey, 0, 49) // Last 50 interactions
    ]);
    
    // Calculate engagement metrics
    const engagementByHour = {};
    const engagementByReferrer = {};
    const engagementByLanguage = {};
    
    recentEngagement.forEach(record => {
      try {
        const data = JSON.parse(record);
        const hour = new Date(data.timestamp).getHours();
        engagementByHour[hour] = (engagementByHour[hour] || 0) + 1;
        engagementByReferrer[data.referrer] = (engagementByReferrer[data.referrer] || 0) + 1;
        engagementByLanguage[data.language] = (engagementByLanguage[data.language] || 0) + 1;
      } catch (e) {
        // Skip invalid records
      }
    });
    
    return {
      totalViews,
      uniqueViews: uniqueViewsCount,
      userViews: userViewsCount,
      dailyViews,
      engagement: recentEngagement.length,
      lastViewed,
      engagementByHour,
      engagementByReferrer,
      engagementByLanguage,
      recentActivity: recentEngagement.length
    };
    
  } catch (error) {
    console.error('Error getting article metrics:', error);
    return {
      totalViews: 0,
      uniqueViews: 0,
      userViews: 0,
      dailyViews: 0,
      engagement: 0,
      lastViewed: 0,
      engagementByHour: {},
      engagementByReferrer: {},
      engagementByLanguage: {},
      recentActivity: 0
    };
  }
}

// Get user's article viewing history
async function getUserArticleHistory(userId) {
  try {
    const userViewsKey = `user_article_views:${userId}`;
    const userViews = await redis.hGetAll(userViewsKey);
    
    const articleHistory = [];
    for (const [articleId, timestamp] of Object.entries(userViews)) {
      const article = await redis.json.get(`news:${articleId}`).catch(() => null);
      if (article) {
        articleHistory.push({
          articleId,
          title: article.title,
          viewedAt: parseInt(timestamp),
          source: article.source?.name || 'unknown'
        });
      }
    }
    
    // Sort by most recent first
    articleHistory.sort((a, b) => b.viewedAt - a.viewedAt);
    
    return articleHistory;
    
  } catch (error) {
    console.error('Error getting user article history:', error);
    return [];
  }
}

// Get trending articles (most viewed in last 24 hours)
async function getTrendingArticles(limit = 10) {
  try {
    const dateKey = new Date().toISOString().split('T')[0];
    const yesterdayKey = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Get all article IDs
    const articleKeys = await redis.keys('news:*');
    const trendingArticles = [];
    
    for (const key of articleKeys) {
      const articleId = key.replace('news:', '');
      const dailyViewsKey = `article_daily_views:${articleId}:${dateKey}`;
      const yesterdayViewsKey = `article_daily_views:${articleId}:${yesterdayKey}`;
      
      const [todayViews, yesterdayViews] = await Promise.all([
        redis.hGet(dailyViewsKey, 'views').then(val => parseInt(val) || 0),
        redis.hGet(yesterdayViewsKey, 'views').then(val => parseInt(val) || 0)
      ]);
      
      if (todayViews > 0) {
        const article = await redis.json.get(key);
        if (article) {
          trendingArticles.push({
            ...article,
            todayViews,
            yesterdayViews,
            growth: yesterdayViews > 0 ? ((todayViews - yesterdayViews) / yesterdayViews * 100) : 0
          });
        }
      }
    }
    
    // Sort by today's views (descending)
    trendingArticles.sort((a, b) => b.todayViews - a.todayViews);
    
    return trendingArticles.slice(0, limit);
    
  } catch (error) {
    console.error('Error getting trending articles:', error);
    return [];
  }
}

module.exports = {
  redis,
  searchArticlesByTopic,
  searchArticlesBySentiment,
  getAllArticles,
  createSearchIndex,
  findSimilarArticles,
  getSimilarArticleCacheStats,
  clearSimilarArticleCache,
  storeArticle,
  articleExists,
  // Add these new exports
  storeUserPreferences,
  getUserPreferences,
  clearPersonalizedCache,
  updateUserPreferences,
  getPersonalizedNews,
  getPersonalizedNewsSearch,
  getAllSources,
  markArticleAsRead,
  // Add the new search functions
  searchNewsWithQuery,
  searchNewsWithTopicIntersection,
  searchNews,
  // Add article metrics functions
  trackArticleMetrics,
  getArticleMetrics,
  getUserArticleHistory,
  getTrendingArticles
};