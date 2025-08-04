# Cache Clearing Documentation

This document describes the cache clearing functionality that preserves user data while clearing all other cache and data.

## Overview

The cache clearing system is designed to clear all cache and data except for user-related data. Based on the data categories shown in the system, the following data types are cleared:

### Data Types Cleared
- `all_articles` - Article data and cache
- `article_daily_views` - Daily view tracking for articles
- `article_engagement` - Article engagement metrics
- `article_last_viewed` - Last viewed timestamps for articles
- `article_unique_views` - Unique view tracking for articles
- `article_user_views` - Article view tracking
- `article_views` - Total view counts for articles
- `news` - Individual article data
- `personalized_search_stats_simple` - Personalized search statistics
- `personalized_stats_simple` - Personalized statistics
- `prefs_version_simple` - Preferences version tracking
- `similar_unique_articles` - Unique articles tracking for similarity

### Data Types Preserved
- `user` - User data and preferences
- `user_article_views` - User article viewing history

## Usage

### 1. Command Line Script

Use the dedicated script to clear cache from the command line:

```bash
# Show help
node src/scripts/clearCacheExceptUser.js --help

# Show cache statistics
node src/scripts/clearCacheExceptUser.js --stats

# Clear all cache except user data
node src/scripts/clearCacheExceptUser.js

# Clear specific cache types
node src/scripts/clearCacheExceptUser.js --specific articles,search

# Force clear without confirmation
node src/scripts/clearCacheExceptUser.js --force
```

### 2. API Endpoints

Use the admin API endpoints to clear cache programmatically:

#### Clear All Cache Except User Data
```bash
POST /admin/clear-all-cache-except-user
```

Response:
```json
{
  "message": "Cache cleared successfully",
  "result": {
    "totalKeysCleared": 1250,
    "preservedUserData": 45,
    "performance": {
      "totalTimeMs": 1500,
      "keysPerSecond": 833,
      "memoryFreed": 52428800,
      "memoryFreedPercent": "15.23"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Clear Specific Cache Types
```bash
POST /admin/clear-specific-cache-types?types=articles,search
```

Response:
```json
{
  "message": "Specific cache types cleared successfully",
  "cacheTypes": ["articles", "search"],
  "result": {
    "totalKeysCleared": 450,
    "preservedUserData": 45
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Get Cache Statistics
```bash
GET /admin/cache-statistics
```

Response:
```json
{
  "message": "Cache statistics retrieved successfully",
  "stats": {
    "totalKeys": 1295,
    "cacheTypes": {
      "Article Data": 500,
      "All Articles Cache": 10,
      "Article Daily Views": 200,
      "User Data": 45
    },
    "memory": {
      "usedMemory": 34359738368,
      "peakMemory": 42949672960,
      "totalKeys": 1295
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Available Cache Types

When using the `--specific` option, you can specify these cache types:

- `articles` - Article data and cache
- `article_metrics` - Article view metrics and engagement
- `search` - Search-related caches
- `similar_articles` - Similar articles cache
- `personalized` - Personalized news cache
- `versions` - Version tracking caches
- `fallbacks` - Fallback caches
- `temp` - Temporary caches
- `vectors` - Vector and embedding caches
- `search_index` - Search index and metadata

## Safety Features

1. **User Data Preservation**: User data (`user:*` and `user_article_views:*`) is always preserved
2. **Confirmation Prompts**: Scripts ask for confirmation before clearing (unless `--force` is used)
3. **Detailed Logging**: All operations are logged with timestamps and metrics
4. **Error Handling**: Errors are caught and reported without stopping the entire process
5. **Performance Metrics**: Clear operations report performance statistics

## Performance Considerations

- Large cache clearing operations may take several seconds
- Memory usage is reported before and after clearing
- Performance metrics show keys per second processed
- The system uses Redis pipelines for efficient bulk operations

## Monitoring

After clearing cache, monitor:
- Application performance
- Cache hit rates
- Memory usage
- User experience

The system will automatically rebuild cache as users interact with the application.

## Troubleshooting

### Common Issues

1. **Redis Connection Error**
   - Check `REDIS_URL` environment variable
   - Ensure Redis server is running

2. **Permission Denied**
   - Ensure the script has execute permissions
   - Check file ownership

3. **Partial Clear**
   - Check error logs for specific pattern failures
   - Retry with `--specific` option for failed patterns

### Logs

All cache clearing operations log:
- Initial Redis memory usage
- Keys preserved (user data)
- Keys cleared per pattern
- Final Redis memory usage
- Performance metrics
- Any errors encountered

## Integration

The cache clearing functions are available as modules:

```javascript
const { 
  clearAllCacheExceptUser, 
  clearSpecificCacheTypes, 
  getCacheStatistics 
} = require('./src/services/cacheClearService');

// Use in your own scripts
await clearAllCacheExceptUser();
``` 