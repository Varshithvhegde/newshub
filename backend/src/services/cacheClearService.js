require('dotenv').config();
const { createClient } = require('redis');

const redis = createClient({ url: process.env.REDIS_URL });

/**
 * Comprehensive cache clearing function that removes all data except user-related data
 * Based on the data categories shown in the image:
 * - all_articles
 * - article_daily_views
 * - article_engagement
 * - article_last_viewed
 * - article_unique_views
 * - article_user_views
 * - article_views
 * - news
 * - personalized_search_stats_simple
 * - personalized_stats_simple
 * - prefs_version_simple
 * - similar_unique_articles
 * - user_article_views
 * - user (PRESERVED)
 */
async function clearAllCacheExceptUser() {
  try {
    console.log('🔍 Starting comprehensive cache clearing process (preserving user data)...\n');
    
    await redis.connect();
    console.log('✅ Connected to Redis\n');

    const startTime = Date.now();
    const metrics = {
      totalKeysCleared: 0,
      cacheTypes: {},
      errors: [],
      performance: {},
      preservedUserData: 0
    };

    // Define cache patterns to clear (excluding user data)
    const cachePatterns = [
      // Article-related caches (from image: all_articles, news)
      { pattern: 'news:*', name: 'Article Data', description: 'Individual article data' },
      { pattern: 'all_articles:*', name: 'All Articles Cache', description: 'Cached all articles results' },
      
      // Article metrics and views (from image: article_daily_views, article_engagement, article_last_viewed, article_unique_views, article_views)
      { pattern: 'article_daily_views:*', name: 'Article Daily Views', description: 'Daily view tracking for articles' },
      { pattern: 'article_engagement:*', name: 'Article Engagement', description: 'Article engagement metrics' },
      { pattern: 'article_last_viewed:*', name: 'Article Last Viewed', description: 'Last viewed timestamps for articles' },
      { pattern: 'article_unique_views:*', name: 'Article Unique Views', description: 'Unique view tracking for articles' },
      { pattern: 'article_views:*', name: 'Article Views', description: 'Total view counts for articles' },
      { pattern: 'article_user_views:*', name: 'Article User Views', description: 'User-specific article view tracking' },
      { pattern: 'user_article_views:*', name: 'User Article Views', description: 'User article view history' },
      
      // Search-related caches
      { pattern: 'search:*', name: 'Search Cache', description: 'Search query results' },
      { pattern: 'topic_search:*', name: 'Topic Search Cache', description: 'Topic-based search results' },
      { pattern: 'sentiment_search:*', name: 'Sentiment Search Cache', description: 'Sentiment-based search results' },
      
      // Similar articles caches (from image: similar_unique_articles)
      { pattern: 'similar:*', name: 'Similar Articles Cache', description: 'Similar articles results' },
      { pattern: 'similar_meta:*', name: 'Similar Articles Metadata', description: 'Similar articles metadata' },
      { pattern: 'similar_stats:*', name: 'Similar Articles Stats', description: 'Similar articles statistics' },
      { pattern: 'similar_bloom:*', name: 'Similar Articles Bloom Filters', description: 'Bloom filters for similar articles' },
      { pattern: 'similar_cache_lru', name: 'Similar Articles LRU', description: 'LRU management for similar articles' },
      { pattern: 'similar_unique_articles:*', name: 'Similar Unique Articles', description: 'Unique articles tracking for similarity' },
      
      // Personalized news caches (from image: personalized_search_stats_simple, personalized_stats_simple)
      { pattern: 'personalized:*', name: 'Personalized News Cache', description: 'Personalized news results' },
      { pattern: 'personalized_simple:*', name: 'Simple Personalized Cache', description: 'Simple personalized news cache' },
      { pattern: 'personalized_search:*', name: 'Personalized Search Cache', description: 'Personalized search results' },
      { pattern: 'personalized_search_simple:*', name: 'Simple Personalized Search Cache', description: 'Simple personalized search cache' },
      { pattern: 'personalized_meta:*', name: 'Personalized Metadata', description: 'Personalized news metadata' },
      { pattern: 'personalized_stats:*', name: 'Personalized Stats', description: 'Personalized news statistics' },
      { pattern: 'personalized_search_stats_simple:*', name: 'Personalized Search Stats Simple', description: 'Simple personalized search statistics' },
      { pattern: 'personalized_stats_simple:*', name: 'Personalized Stats Simple', description: 'Simple personalized statistics' },
      { pattern: 'personalized_cache_lru', name: 'Personalized LRU', description: 'LRU management for personalized news' },
      
      // Version and fallback caches (from image: prefs_version_simple)
      { pattern: 'prefs_version:*', name: 'Preferences Version', description: 'Preferences version tracking' },
      { pattern: 'prefs_version_simple:*', name: 'Simple Preferences Version', description: 'Simple preferences version tracking' },
      { pattern: 'fallback:*', name: 'Fallback Cache', description: 'Fallback cache data' },
      { pattern: 'personalized_fallback:*', name: 'Personalized Fallback', description: 'Personalized fallback cache' },
      
      // Temporary and utility caches
      { pattern: 'temp:*', name: 'Temporary Cache', description: 'Temporary cache data' },
      { pattern: 'cache_stats:*', name: 'Cache Statistics', description: 'Cache performance statistics' },
      
      // Vector and embedding caches
      { pattern: 'vector:*', name: 'Vector Cache', description: 'Vector embedding cache' },
      { pattern: 'embedding:*', name: 'Embedding Cache', description: 'Embedding data cache' },
      
      // Search index and metadata
      { pattern: 'idx:*', name: 'Search Index', description: 'Search index data' },
      { pattern: 'search_meta:*', name: 'Search Metadata', description: 'Search metadata cache' }
    ];

    // Define user data patterns to PRESERVE (from image: user)
    // Note: article_user_views and user_article_views are NOT preserved as they are view tracking data
    const userDataPatterns = [
      'user:*'
    ];

    // Get initial Redis info
    const initialInfo = await redis.info('memory');
    const initialMemory = parseRedisMemoryInfo(initialInfo);
    
    console.log('📊 Initial Redis Memory Usage:');
    console.log(`   Used Memory: ${formatBytes(initialMemory.usedMemory)}`);
    console.log(`   Peak Memory: ${formatBytes(initialMemory.peakMemory)}`);
    console.log(`   Total Keys: ${initialMemory.totalKeys}\n`);

    // Count preserved user data
    console.log('🔒 Counting preserved user data...');
    for (const userPattern of userDataPatterns) {
      const userKeys = await redis.keys(userPattern);
      metrics.preservedUserData += userKeys.length;
      console.log(`   Preserving ${userKeys.length} keys matching pattern: ${userPattern}`);
    }
    console.log(`   Total user data keys preserved: ${metrics.preservedUserData}\n`);

    // Clear each cache type
    for (const cacheType of cachePatterns) {
      const cacheStartTime = Date.now();
      
      try {
        console.log(`🧹 Clearing ${cacheType.name}...`);
        
        const keys = await redis.keys(cacheType.pattern);
        const keyCount = keys.length;
        
        if (keyCount > 0) {
          await redis.del(keys);
          console.log(`   ✅ Cleared ${keyCount} keys`);
          
          metrics.cacheTypes[cacheType.name] = {
            keysCleared: keyCount,
            description: cacheType.description,
            pattern: cacheType.pattern,
            timeMs: Date.now() - cacheStartTime
          };
          
          metrics.totalKeysCleared += keyCount;
        } else {
          console.log(`   ℹ️  No keys found for pattern: ${cacheType.pattern}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error clearing ${cacheType.name}:`, error.message);
        metrics.errors.push({
          cacheType: cacheType.name,
          error: error.message,
          pattern: cacheType.pattern
        });
      }
    }

    // Get final Redis info
    const finalInfo = await redis.info('memory');
    const finalMemory = parseRedisMemoryInfo(finalInfo);
    
    // Calculate performance metrics
    const totalTime = Date.now() - startTime;
    metrics.performance = {
      totalTimeMs: totalTime,
      keysPerSecond: Math.round(metrics.totalKeysCleared / (totalTime / 1000)),
      memoryFreed: initialMemory.usedMemory - finalMemory.usedMemory,
      memoryFreedPercent: ((initialMemory.usedMemory - finalMemory.usedMemory) / initialMemory.usedMemory * 100).toFixed(2)
    };

    // Print results
    console.log('\n📊 Cache Clearing Results:');
    console.log('=' .repeat(50));
    console.log(`Total Keys Cleared: ${metrics.totalKeysCleared}`);
    console.log(`User Data Preserved: ${metrics.preservedUserData} keys`);
    console.log(`Total Time: ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log(`Performance: ${metrics.performance.keysPerSecond} keys/second`);
    console.log(`Memory Freed: ${formatBytes(metrics.performance.memoryFreed)} (${metrics.performance.memoryFreedPercent}%)`);
    
    if (metrics.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${metrics.errors.length}`);
      metrics.errors.forEach(error => {
        console.log(`   - ${error.cacheType}: ${error.error}`);
      });
    }

    console.log('\n📊 Final Redis Memory Usage:');
    console.log(`   Used Memory: ${formatBytes(finalMemory.usedMemory)}`);
    console.log(`   Peak Memory: ${formatBytes(finalMemory.peakMemory)}`);
    console.log(`   Total Keys: ${finalMemory.totalKeys}`);

    console.log('\n✅ Cache clearing completed successfully!');
    console.log('🔒 User data has been preserved as requested.');

    return metrics;

  } catch (error) {
    console.error('💥 Error in cache clearing process:', error);
    throw error;
  } finally {
    await redis.disconnect();
    console.log('\n🔌 Disconnected from Redis');
  }
}

/**
 * Clear specific cache types while preserving user data
 */
async function clearSpecificCacheTypes(cacheTypes = [], preserveUserData = true) {
  try {
    console.log('🔍 Starting specific cache clearing process...\n');
    
    await redis.connect();
    console.log('✅ Connected to Redis\n');

    const startTime = Date.now();
    const metrics = {
      totalKeysCleared: 0,
      cacheTypes: {},
      errors: [],
      performance: {},
      preservedUserData: 0
    };

    // Define all available cache patterns
    const allCachePatterns = {
      'articles': [
        { pattern: 'news:*', name: 'Article Data' },
        { pattern: 'all_articles:*', name: 'All Articles Cache' }
      ],
      'article_metrics': [
        { pattern: 'article_daily_views:*', name: 'Article Daily Views' },
        { pattern: 'article_engagement:*', name: 'Article Engagement' },
        { pattern: 'article_last_viewed:*', name: 'Article Last Viewed' },
        { pattern: 'article_unique_views:*', name: 'Article Unique Views' },
        { pattern: 'article_views:*', name: 'Article Views' },
        { pattern: 'article_user_views:*', name: 'Article User Views' },
        { pattern: 'user_article_views:*', name: 'User Article Views' }
      ],
      'search': [
        { pattern: 'search:*', name: 'Search Cache' },
        { pattern: 'topic_search:*', name: 'Topic Search Cache' },
        { pattern: 'sentiment_search:*', name: 'Sentiment Search Cache' }
      ],
      'similar_articles': [
        { pattern: 'similar:*', name: 'Similar Articles Cache' },
        { pattern: 'similar_meta:*', name: 'Similar Articles Metadata' },
        { pattern: 'similar_stats:*', name: 'Similar Articles Stats' },
        { pattern: 'similar_bloom:*', name: 'Similar Articles Bloom Filters' },
        { pattern: 'similar_cache_lru', name: 'Similar Articles LRU' },
        { pattern: 'similar_unique_articles:*', name: 'Similar Unique Articles' }
      ],
      'personalized': [
        { pattern: 'personalized:*', name: 'Personalized News Cache' },
        { pattern: 'personalized_simple:*', name: 'Simple Personalized Cache' },
        { pattern: 'personalized_search:*', name: 'Personalized Search Cache' },
        { pattern: 'personalized_search_simple:*', name: 'Simple Personalized Search Cache' },
        { pattern: 'personalized_meta:*', name: 'Personalized Metadata' },
        { pattern: 'personalized_stats:*', name: 'Personalized Stats' },
        { pattern: 'personalized_search_stats_simple:*', name: 'Personalized Search Stats Simple' },
        { pattern: 'personalized_stats_simple:*', name: 'Personalized Stats Simple' },
        { pattern: 'personalized_cache_lru', name: 'Personalized LRU' }
      ],
      'versions': [
        { pattern: 'prefs_version:*', name: 'Preferences Version' },
        { pattern: 'prefs_version_simple:*', name: 'Simple Preferences Version' }
      ],
      'fallbacks': [
        { pattern: 'fallback:*', name: 'Fallback Cache' },
        { pattern: 'personalized_fallback:*', name: 'Personalized Fallback' }
      ],
      'temp': [
        { pattern: 'temp:*', name: 'Temporary Cache' },
        { pattern: 'cache_stats:*', name: 'Cache Statistics' }
      ],
      'vectors': [
        { pattern: 'vector:*', name: 'Vector Cache' },
        { pattern: 'embedding:*', name: 'Embedding Cache' }
      ],
      'search_index': [
        { pattern: 'idx:*', name: 'Search Index' },
        { pattern: 'search_meta:*', name: 'Search Metadata' }
      ]
    };

    // If no specific types provided, clear all except user data
    if (cacheTypes.length === 0) {
      console.log('No specific cache types provided, clearing all except user data...');
      return await clearAllCacheExceptUser();
    }

    // Count preserved user data if requested
    if (preserveUserData) {
      const userDataPatterns = ['user:*'];
      for (const userPattern of userDataPatterns) {
        const userKeys = await redis.keys(userPattern);
        metrics.preservedUserData += userKeys.length;
      }
      console.log(`🔒 Preserving ${metrics.preservedUserData} user data keys`);
    }

    // Clear specified cache types
    for (const cacheType of cacheTypes) {
      if (!allCachePatterns[cacheType]) {
        console.log(`⚠️  Unknown cache type: ${cacheType}`);
        continue;
      }

      console.log(`\n🧹 Clearing ${cacheType} cache...`);
      
      for (const pattern of allCachePatterns[cacheType]) {
        try {
          const keys = await redis.keys(pattern.pattern);
          const keyCount = keys.length;
          
          if (keyCount > 0) {
            await redis.del(keys);
            console.log(`   ✅ Cleared ${keyCount} keys (${pattern.name})`);
            
            metrics.cacheTypes[pattern.name] = {
              keysCleared: keyCount,
              pattern: pattern.pattern,
              timeMs: Date.now() - startTime
            };
            
            metrics.totalKeysCleared += keyCount;
          }
        } catch (error) {
          console.error(`   ❌ Error clearing ${pattern.name}:`, error.message);
          metrics.errors.push({
            cacheType: pattern.name,
            error: error.message,
            pattern: pattern.pattern
          });
        }
      }
    }

    const totalTime = Date.now() - startTime;
    metrics.performance = {
      totalTimeMs: totalTime,
      keysPerSecond: Math.round(metrics.totalKeysCleared / (totalTime / 1000))
    };

    console.log('\n📊 Specific Cache Clearing Results:');
    console.log('=' .repeat(50));
    console.log(`Cache Types Cleared: ${cacheTypes.join(', ')}`);
    console.log(`Total Keys Cleared: ${metrics.totalKeysCleared}`);
    console.log(`User Data Preserved: ${metrics.preservedUserData} keys`);
    console.log(`Total Time: ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log(`Performance: ${metrics.performance.keysPerSecond} keys/second`);

    if (metrics.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${metrics.errors.length}`);
      metrics.errors.forEach(error => {
        console.log(`   - ${error.cacheType}: ${error.error}`);
      });
    }

    console.log('\n✅ Specific cache clearing completed successfully!');
    return metrics;

  } catch (error) {
    console.error('💥 Error in specific cache clearing process:', error);
    throw error;
  } finally {
    await redis.disconnect();
    console.log('\n🔌 Disconnected from Redis');
  }
}

/**
 * Get cache statistics without clearing anything
 */
async function getCacheStatistics() {
  try {
    console.log('📊 Getting cache statistics...\n');
    
    await redis.connect();
    console.log('✅ Connected to Redis\n');

    const stats = {
      totalKeys: 0,
      cacheTypes: {},
      userData: {},
      memory: {}
    };

    // Define all cache patterns
    const allPatterns = [
      { pattern: 'news:*', name: 'Article Data' },
      { pattern: 'all_articles:*', name: 'All Articles Cache' },
      { pattern: 'article_daily_views:*', name: 'Article Daily Views' },
      { pattern: 'article_engagement:*', name: 'Article Engagement' },
      { pattern: 'article_last_viewed:*', name: 'Article Last Viewed' },
      { pattern: 'article_unique_views:*', name: 'Article Unique Views' },
      { pattern: 'article_views:*', name: 'Article Views' },
      { pattern: 'article_user_views:*', name: 'Article User Views' },
      { pattern: 'search:*', name: 'Search Cache' },
      { pattern: 'similar:*', name: 'Similar Articles Cache' },
      { pattern: 'personalized:*', name: 'Personalized News Cache' },
      { pattern: 'personalized_simple:*', name: 'Simple Personalized Cache' },
      { pattern: 'user:*', name: 'User Data' },
      { pattern: 'user_article_views:*', name: 'User Article Views' }
    ];

    // Count keys for each pattern
    for (const pattern of allPatterns) {
      const keys = await redis.keys(pattern.pattern);
      stats.cacheTypes[pattern.name] = keys.length;
      stats.totalKeys += keys.length;
    }

    // Get Redis memory info
    const memoryInfo = await redis.info('memory');
    stats.memory = parseRedisMemoryInfo(memoryInfo);

    // Print statistics
    console.log('📊 Cache Statistics:');
    console.log('=' .repeat(40));
    console.log(`Total Keys: ${stats.totalKeys}`);
    console.log(`Used Memory: ${formatBytes(stats.memory.usedMemory)}`);
    console.log(`Peak Memory: ${formatBytes(stats.memory.peakMemory)}`);
    
    console.log('\n📋 Cache Type Breakdown:');
    Object.entries(stats.cacheTypes)
      .sort(([,a], [,b]) => b - a)
      .forEach(([name, count]) => {
        if (count > 0) {
          console.log(`   ${name}: ${count} keys`);
        }
      });

    return stats;

  } catch (error) {
    console.error('💥 Error getting cache statistics:', error);
    throw error;
  } finally {
    await redis.disconnect();
    console.log('\n🔌 Disconnected from Redis');
  }
}

// Utility functions
function parseRedisMemoryInfo(info) {
  const lines = info.split('\r\n');
  const memory = {};
  
  for (const line of lines) {
    if (line.includes('used_memory:')) {
      memory.usedMemory = parseInt(line.split(':')[1]);
    } else if (line.includes('used_memory_peak:')) {
      memory.peakMemory = parseInt(line.split(':')[1]);
    } else if (line.includes('db0:keys=')) {
      memory.totalKeys = parseInt(line.split('=')[1]);
    }
  }
  
  return memory;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  clearAllCacheExceptUser,
  clearSpecificCacheTypes,
  getCacheStatistics
}; 