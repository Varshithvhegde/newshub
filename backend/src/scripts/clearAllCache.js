// create a script to clear all cache from redis and with metrics
require('dotenv').config();
const { createClient } = require('redis');

const redis = createClient({ url: process.env.REDIS_URL });

async function clearAllCache() {
  try {
    console.log('🔍 Starting comprehensive cache clearing process...\n');
    
    await redis.connect();
    console.log('✅ Connected to Redis\n');

    const startTime = Date.now();
    const metrics = {
      totalKeysCleared: 0,
      cacheTypes: {},
      errors: [],
      performance: {}
    };

    // Define all cache patterns to clear
    const cachePatterns = [
      // Article-related caches
      { pattern: 'news:*', name: 'Article Data', description: 'Individual article data' },
      { pattern: 'all_articles:*', name: 'All Articles Cache', description: 'Cached all articles results' },
      
      // Search-related caches
      { pattern: 'search:*', name: 'Search Cache', description: 'Search query results' },
      { pattern: 'topic_search:*', name: 'Topic Search Cache', description: 'Topic-based search results' },
      { pattern: 'sentiment_search:*', name: 'Sentiment Search Cache', description: 'Sentiment-based search results' },
      
      // Similar articles caches
      { pattern: 'similar:*', name: 'Similar Articles Cache', description: 'Similar articles results' },
      { pattern: 'similar_meta:*', name: 'Similar Articles Metadata', description: 'Similar articles metadata' },
      { pattern: 'similar_stats:*', name: 'Similar Articles Stats', description: 'Similar articles statistics' },
      { pattern: 'similar_bloom:*', name: 'Similar Articles Bloom Filters', description: 'Bloom filters for similar articles' },
      { pattern: 'similar_cache_lru', name: 'Similar Articles LRU', description: 'LRU management for similar articles' },
      
      // Personalized news caches
      { pattern: 'personalized:*', name: 'Personalized News Cache', description: 'Personalized news results' },
      { pattern: 'personalized_simple:*', name: 'Simple Personalized Cache', description: 'Simple personalized news cache' },
      { pattern: 'personalized_search:*', name: 'Personalized Search Cache', description: 'Personalized search results' },
      { pattern: 'personalized_search_simple:*', name: 'Simple Personalized Search Cache', description: 'Simple personalized search cache' },
      { pattern: 'personalized_meta:*', name: 'Personalized Metadata', description: 'Personalized news metadata' },
      { pattern: 'personalized_stats:*', name: 'Personalized Stats', description: 'Personalized news statistics' },
      { pattern: 'personalized_cache_lru', name: 'Personalized LRU', description: 'LRU management for personalized news' },
      
      // User preferences and data
      { pattern: 'user:*:preferences', name: 'User Preferences', description: 'User preference data' },
      { pattern: 'user:*:read:*', name: 'User Read Articles', description: 'User read article tracking' },
      { pattern: 'user:*:read_set', name: 'User Read Sets', description: 'User read article sets' },
      
      // Version and fallback caches
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

    // Get initial Redis info
    const initialInfo = await redis.info('memory');
    const initialMemory = parseRedisMemoryInfo(initialInfo);
    
    console.log('📊 Initial Redis Memory Usage:');
    console.log(`   Used Memory: ${formatBytes(initialMemory.usedMemory)}`);
    console.log(`   Peak Memory: ${formatBytes(initialMemory.peakMemory)}`);
    console.log(`   Total Keys: ${initialMemory.totalKeys}\n`);

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
          metrics.cacheTypes[cacheType.name] = {
            keysCleared: 0,
            description: cacheType.description,
            pattern: cacheType.pattern,
            timeMs: Date.now() - cacheStartTime
          };
        }
        
      } catch (error) {
        console.log(`   ❌ Error clearing ${cacheType.name}: ${error.message}`);
        metrics.errors.push({
          cacheType: cacheType.name,
          error: error.message,
          pattern: cacheType.pattern
        });
      }
    }

    // Clear search index (if exists)
    try {
      console.log('🧹 Clearing Search Index...');
      await redis.ft.dropIndex('idx:news');
      console.log('   ✅ Search index dropped');
      metrics.cacheTypes['Search Index'] = {
        keysCleared: 1,
        description: 'RedisSearch index',
        pattern: 'idx:news',
        timeMs: 0
      };
    } catch (error) {
      console.log(`   ℹ️  Search index not found or already dropped: ${error.message}`);
    }

    // Get final Redis info
    const finalInfo = await redis.info('memory');
    const finalMemory = parseRedisMemoryInfo(finalInfo);
    
    // Calculate performance metrics
    const totalTime = Date.now() - startTime;
    const memoryFreed = initialMemory.usedMemory - finalMemory.usedMemory;
    const keysFreed = initialMemory.totalKeys - finalMemory.totalKeys;

    metrics.performance = {
      totalTimeMs: totalTime,
      memoryFreedBytes: memoryFreed,
      memoryFreedFormatted: formatBytes(memoryFreed),
      keysFreed: keysFreed,
      averageTimePerKey: metrics.totalKeysCleared > 0 ? totalTime / metrics.totalKeysCleared : 0
    };

    // Print final report
    console.log('\n📈 CACHE CLEARING COMPLETE');
    console.log('=' .repeat(50));
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Total Keys Cleared: ${metrics.totalKeysCleared}`);
    console.log(`   Total Time: ${totalTime}ms`);
    console.log(`   Memory Freed: ${formatBytes(memoryFreed)}`);
    console.log(`   Keys Freed: ${keysFreed}`);
    console.log(`   Average Time per Key: ${metrics.performance.averageTimePerKey.toFixed(2)}ms`);

    console.log('\n📋 CACHE TYPES CLEARED:');
    Object.entries(metrics.cacheTypes).forEach(([name, data]) => {
      if (data.keysCleared > 0) {
        console.log(`   ${name}: ${data.keysCleared} keys (${data.timeMs}ms)`);
      }
    });

    if (metrics.errors.length > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:');
      metrics.errors.forEach(error => {
        console.log(`   ${error.cacheType}: ${error.error}`);
      });
    }

    console.log('\n💾 MEMORY USAGE:');
    console.log(`   Before: ${formatBytes(initialMemory.usedMemory)}`);
    console.log(`   After:  ${formatBytes(finalMemory.usedMemory)}`);
    console.log(`   Freed:  ${formatBytes(memoryFreed)}`);

    console.log('\n🎯 RECOMMENDATIONS:');
    if (memoryFreed > 0) {
      console.log(`   ✅ Successfully freed ${formatBytes(memoryFreed)} of memory`);
    }
    if (metrics.totalKeysCleared > 0) {
      console.log(`   ✅ Cleared ${metrics.totalKeysCleared} cache entries`);
    }
    if (totalTime < 5000) {
      console.log('   ✅ Cache clearing completed quickly');
    } else {
      console.log('   ⚠️  Cache clearing took longer than expected');
    }

    // Save metrics to file
    const fs = require('fs');
    const metricsFile = `cache_clear_metrics_${Date.now()}.json`;
    fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
    console.log(`\n📄 Metrics saved to: ${metricsFile}`);

    return metrics;

  } catch (error) {
    console.error('❌ Fatal error during cache clearing:', error);
    throw error;
  } finally {
    await redis.disconnect();
    console.log('\n🔌 Disconnected from Redis');
  }
}

// Helper function to parse Redis memory info
function parseRedisMemoryInfo(info) {
  const lines = info.split('\n');
  const memory = {};
  
  lines.forEach(line => {
    if (line.startsWith('used_memory:')) {
      memory.usedMemory = parseInt(line.split(':')[1]);
    } else if (line.startsWith('used_memory_peak:')) {
      memory.peakMemory = parseInt(line.split(':')[1]);
    } else if (line.startsWith('db0:')) {
      const dbInfo = line.split(':')[1];
      const keysMatch = dbInfo.match(/keys=(\d+)/);
      if (keysMatch) {
        memory.totalKeys = parseInt(keysMatch[1]);
      }
    }
  });
  
  return memory;
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to get cache statistics before clearing
async function getCacheStatistics() {
  try {
    await redis.connect();
    
    console.log('📊 CACHE STATISTICS BEFORE CLEARING');
    console.log('=' .repeat(40));
    
    const patterns = [
      'news:*',
      'similar:*',
      'personalized:*',
      'user:*',
      'all_articles:*',
      'search:*'
    ];
    
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      console.log(`${pattern}: ${keys.length} keys`);
    }
    
    const info = await redis.info('memory');
    const memory = parseRedisMemoryInfo(info);
    console.log(`\nTotal Memory Used: ${formatBytes(memory.usedMemory)}`);
    console.log(`Total Keys: ${memory.totalKeys}`);
    
    await redis.disconnect();
    
  } catch (error) {
    console.error('Error getting cache statistics:', error);
  }
}

// Nuclear option: Clear EVERYTHING in Redis
async function clearEverythingInRedis() {
  try {
    console.log('☢️  NUCLEAR OPTION: Clearing EVERYTHING in Redis...\n');
    
    await redis.connect();
    console.log('✅ Connected to Redis\n');

    const startTime = Date.now();
    const metrics = {
      totalKeysCleared: 0,
      indexesDropped: 0,
      errors: [],
      performance: {}
    };

    // Get initial Redis info
    const initialInfo = await redis.info('memory');
    const initialMemory = parseRedisMemoryInfo(initialInfo);
    
    console.log('📊 Initial Redis State:');
    console.log(`   Used Memory: ${formatBytes(initialMemory.usedMemory)}`);
    console.log(`   Peak Memory: ${formatBytes(initialMemory.peakMemory)}`);
    console.log(`   Total Keys: ${initialMemory.totalKeys}\n`);

    // Step 1: Get ALL keys in Redis
    console.log('🔍 Scanning for ALL keys in Redis...');
    let allKeys = [];
    let cursor = 0;
    
    do {
      const result = await redis.scan(cursor, { COUNT: 1000 });
      cursor = result.cursor;
      allKeys = allKeys.concat(result.keys);
      console.log(`   Found ${allKeys.length} keys so far...`);
    } while (cursor !== 0);

    console.log(`\n📋 Total keys found: ${allKeys.length}`);

    // Step 2: Clear ALL keys
    if (allKeys.length > 0) {
      console.log('\n🧹 Clearing ALL keys...');
      
      // Clear in batches to avoid memory issues
      const batchSize = 1000;
      for (let i = 0; i < allKeys.length; i += batchSize) {
        const batch = allKeys.slice(i, i + batchSize);
        await redis.del(batch);
        console.log(`   ✅ Cleared batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allKeys.length / batchSize)} (${batch.length} keys)`);
      }
      
      metrics.totalKeysCleared = allKeys.length;
    }

    // Step 3: Drop ALL search indexes
    console.log('\n🗑️  Dropping ALL search indexes...');
    
    const indexPatterns = [
      'idx:news',
      'idx:*',
      'search:*',
      'vector:*',
      'embedding:*'
    ];

    for (const indexPattern of indexPatterns) {
      try {
        // Try to get all indexes matching the pattern
        const indexes = await redis.ft.list();
        for (const index of indexes) {
          try {
            await redis.ft.dropIndex(index);
            console.log(`   ✅ Dropped index: ${index}`);
            metrics.indexesDropped++;
          } catch (dropError) {
            console.log(`   ℹ️  Could not drop index ${index}: ${dropError.message}`);
          }
        }
      } catch (error) {
        console.log(`   ℹ️  No indexes found for pattern: ${indexPattern}`);
      }
    }

    // Step 4: Clear ALL databases (if multiple databases exist)
    console.log('\n🗄️  Clearing ALL databases...');
    
    try {
      // Get database info
      const dbInfo = await redis.info('keyspace');
      const dbLines = dbInfo.split('\n').filter(line => line.startsWith('db'));
      
      for (const dbLine of dbLines) {
        const dbMatch = dbLine.match(/db(\d+):keys=(\d+)/);
        if (dbMatch) {
          const dbNumber = parseInt(dbMatch[1]);
          const keyCount = parseInt(dbMatch[2]);
          
          if (keyCount > 0) {
            console.log(`   Clearing database ${dbNumber} (${keyCount} keys)...`);
            // Switch to database and clear it
            await redis.select(dbNumber);
            await redis.flushDb();
            console.log(`   ✅ Cleared database ${dbNumber}`);
          }
        }
      }
      
      // Switch back to default database
      await redis.select(0);
    } catch (error) {
      console.log(`   ℹ️  Could not clear additional databases: ${error.message}`);
    }

    // Step 5: Clear ALL streams, sets, lists, etc.
    console.log('\n🔄 Clearing ALL data structures...');
    
    try {
      // Clear all streams
      const streams = await redis.xInfo('STREAM', '*');
      if (streams && streams.length > 0) {
        for (const stream of streams) {
          await redis.del(stream.name);
          console.log(`   ✅ Cleared stream: ${stream.name}`);
        }
      }
    } catch (error) {
      console.log(`   ℹ️  No streams to clear: ${error.message}`);
    }

    // Step 6: Clear ALL modules and extensions
    console.log('\n🔧 Clearing ALL modules and extensions...');
    
    try {
      // Clear any custom modules or extensions
      const modules = await redis.info('modules');
      if (modules && modules.includes('search')) {
        console.log('   ℹ️  Search module detected - indexes already cleared');
      }
    } catch (error) {
      console.log(`   ℹ️  No modules to clear: ${error.message}`);
    }

    // Step 7: Clear ALL configuration and metadata
    console.log('\n⚙️  Clearing ALL configuration and metadata...');
    
    try {
      // Clear any configuration keys
      const configKeys = await redis.keys('config:*');
      if (configKeys.length > 0) {
        await redis.del(configKeys);
        console.log(`   ✅ Cleared ${configKeys.length} configuration keys`);
      }
    } catch (error) {
      console.log(`   ℹ️  No configuration keys to clear: ${error.message}`);
    }

    // Get final Redis info
    const finalInfo = await redis.info('memory');
    const finalMemory = parseRedisMemoryInfo(finalInfo);
    
    // Calculate performance metrics
    const totalTime = Date.now() - startTime;
    const memoryFreed = initialMemory.usedMemory - finalMemory.usedMemory;
    const keysFreed = initialMemory.totalKeys - finalMemory.totalKeys;

    metrics.performance = {
      totalTimeMs: totalTime,
      memoryFreedBytes: memoryFreed,
      memoryFreedFormatted: formatBytes(memoryFreed),
      keysFreed: keysFreed,
      averageTimePerKey: metrics.totalKeysCleared > 0 ? totalTime / metrics.totalKeysCleared : 0
    };

    // Print final report
    console.log('\n☢️  NUCLEAR CLEARING COMPLETE');
    console.log('=' .repeat(50));
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Total Keys Cleared: ${metrics.totalKeysCleared}`);
    console.log(`   Indexes Dropped: ${metrics.indexesDropped}`);
    console.log(`   Total Time: ${totalTime}ms`);
    console.log(`   Memory Freed: ${formatBytes(memoryFreed)}`);
    console.log(`   Keys Freed: ${keysFreed}`);
    console.log(`   Average Time per Key: ${metrics.performance.averageTimePerKey.toFixed(2)}ms`);

    if (metrics.errors.length > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:');
      metrics.errors.forEach(error => {
        console.log(`   ${error.type}: ${error.error}`);
      });
    }

    console.log('\n💾 MEMORY USAGE:');
    console.log(`   Before: ${formatBytes(initialMemory.usedMemory)}`);
    console.log(`   After:  ${formatBytes(finalMemory.usedMemory)}`);
    console.log(`   Freed:  ${formatBytes(memoryFreed)}`);

    console.log('\n⚠️  WARNING:');
    console.log('   This operation cleared EVERYTHING in Redis!');
    console.log('   All data, indexes, configurations, and cache have been removed.');
    console.log('   You will need to rebuild your search indexes and reload data.');

    // Save metrics to file
    const fs = require('fs');
    const metricsFile = `nuclear_clear_metrics_${Date.now()}.json`;
    fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
    console.log(`\n📄 Nuclear clear metrics saved to: ${metricsFile}`);

    return metrics;

  } catch (error) {
    console.error('❌ Fatal error during nuclear clearing:', error);
    throw error;
  } finally {
    await redis.disconnect();
    console.log('\n🔌 Disconnected from Redis');
  }
}

// Function to get complete Redis statistics
async function getCompleteRedisStatistics() {
  try {
    await redis.connect();
    
    console.log('📊 COMPLETE REDIS STATISTICS');
    console.log('=' .repeat(40));
    
    // Get memory info
    const memoryInfo = await redis.info('memory');
    const memory = parseRedisMemoryInfo(memoryInfo);
    console.log(`\n💾 Memory Usage:`);
    console.log(`   Used Memory: ${formatBytes(memory.usedMemory)}`);
    console.log(`   Peak Memory: ${formatBytes(memory.peakMemory)}`);
    console.log(`   Total Keys: ${memory.totalKeys}`);

    // Get all keys by pattern
    const patterns = [
      'news:*',
      'similar:*',
      'personalized:*',
      'user:*',
      'all_articles:*',
      'search:*',
      'vector:*',
      'embedding:*',
      'temp:*',
      'cache:*',
      'stats:*',
      'meta:*',
      'version:*',
      'fallback:*',
      'bloom:*',
      'lru:*',
      'config:*',
      'idx:*'
    ];
    
    console.log('\n🔑 Keys by Pattern:');
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        console.log(`   ${pattern}: ${keys.length} keys`);
      }
    }

    // Get database info
    const dbInfo = await redis.info('keyspace');
    const dbLines = dbInfo.split('\n').filter(line => line.startsWith('db'));
    
    if (dbLines.length > 0) {
      console.log('\n🗄️  Database Information:');
      for (const dbLine of dbLines) {
        console.log(`   ${dbLine}`);
      }
    }

    // Get index information
    try {
      const indexes = await redis.ft.list();
      if (indexes.length > 0) {
        console.log('\n🔍 Search Indexes:');
        for (const index of indexes) {
          console.log(`   ${index}`);
        }
      }
    } catch (error) {
      console.log('\n🔍 No search indexes found');
    }

    await redis.disconnect();
    
  } catch (error) {
    console.error('Error getting complete Redis statistics:', error);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--stats') || args.includes('-s')) {
    getCacheStatistics();
  } else if (args.includes('--nuclear') || args.includes('-n')) {
    clearEverythingInRedis()
      .then(() => {
        console.log('\n✅ Nuclear clearing completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ Nuclear clearing failed:', error);
        process.exit(1);
      });
  } else {
    console.log('🚀 Starting cache clearing process...\n');
    clearAllCache()
      .then(() => {
        console.log('\n✅ Cache clearing completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ Cache clearing failed:', error);
        process.exit(1);
      });
  }
}

module.exports = {
  clearAllCache,
  getCacheStatistics,
  clearEverythingInRedis,
  getCompleteRedisStatistics
};
