# Redis Cache Management

This directory contains comprehensive tools for managing Redis cache in the news summarization application.

## Files

- `clearAllCache.js` - Core cache clearing functionality with detailed metrics
- `clearCache.js` - User-friendly wrapper script with interactive prompts
- `CACHE_MANAGEMENT.md` - This documentation file

## Quick Start

### Using npm scripts (recommended)

```bash
# Show cache statistics
npm run cache:stats

# Clear all cache (with confirmation)
npm run cache:clear

# Force clear all cache (no confirmation)
npm run cache:force

# Show help
npm run cache:help

# ☢️  NUCLEAR: Clear everything in Redis
npm run cache:nuclear

# Show complete Redis statistics
npm run cache:complete-stats

### Using Node directly

```bash
# Show cache statistics
node clearCache.js --stats

# Clear all cache (with confirmation)
node clearCache.js --clear

# Force clear all cache (no confirmation)
node clearCache.js --force

# Show help
node clearCache.js --help

# ☢️  NUCLEAR: Clear everything in Redis
node clearCache.js --nuclear

# Show complete Redis statistics
node clearCache.js --complete-stats

## Cache Types Cleared

### Regular Cache Clearing
The script clears the following cache types:

### Article Data
- `news:*` - Individual article data
- `all_articles:*` - Cached all articles results

### Search Caches
- `search:*` - Search query results
- `topic_search:*` - Topic-based search results
- `sentiment_search:*` - Sentiment-based search results

### Similar Articles
- `similar:*` - Similar articles results
- `similar_meta:*` - Similar articles metadata
- `similar_stats:*` - Similar articles statistics
- `similar_bloom:*` - Bloom filters for similar articles
- `similar_cache_lru` - LRU management for similar articles

### Personalized News
- `personalized:*` - Personalized news results
- `personalized_simple:*` - Simple personalized news cache
- `personalized_search:*` - Personalized search results
- `personalized_search_simple:*` - Simple personalized search cache
- `personalized_meta:*` - Personalized news metadata
- `personalized_stats:*` - Personalized news statistics
- `personalized_cache_lru` - LRU management for personalized news

### User Data
- `user:*:preferences` - User preference data
- `user:*:read:*` - User read article tracking
- `user:*:read_set` - User read article sets

### Version and Fallback
- `prefs_version:*` - Preferences version tracking
- `prefs_version_simple:*` - Simple preferences version tracking
- `fallback:*` - Fallback cache data
- `personalized_fallback:*` - Personalized fallback cache

### Temporary and Utility
- `temp:*` - Temporary cache data
- `cache_stats:*` - Cache performance statistics

### Vector and Embedding
- `vector:*` - Vector embedding cache
- `embedding:*` - Embedding data cache

### Search Index
- `idx:*` - Search index data
- `search_meta:*` - Search metadata cache

### ☢️  Nuclear Option
The nuclear option (`--nuclear`) clears **EVERYTHING** in Redis:

- **ALL keys** - Every single key in Redis
- **ALL databases** - All Redis databases (db0, db1, etc.)
- **ALL indexes** - All search indexes and vector indexes
- **ALL streams** - All Redis streams
- **ALL configurations** - All configuration keys
- **ALL modules** - All module data
- **ALL metadata** - All metadata and statistics

⚠️  **WARNING**: This is a nuclear option that will completely wipe Redis clean!

## Metrics and Reporting

The script provides detailed metrics including:

- **Total keys cleared** - Number of cache entries removed
- **Memory freed** - Amount of memory reclaimed
- **Performance metrics** - Time taken and average time per key
- **Error tracking** - Any errors encountered during clearing
- **Cache type breakdown** - Detailed breakdown by cache type

### Metrics File

After each run, a JSON file is created with detailed metrics:
```
cache_clear_metrics_1234567890.json
```

This file contains:
- Performance data
- Memory usage before/after
- Error logs
- Cache type statistics

## Safety Features

### Regular Cache Clearing
- **Confirmation prompt** - Asks for confirmation before clearing (unless --force is used)
- **Error handling** - Gracefully handles errors and continues with other cache types
- **Detailed logging** - Shows progress and results for each cache type
- **Non-destructive** - Only clears cache, doesn't affect actual data

### ☢️  Nuclear Option Safety
- **Double confirmation** - Requires typing "NUCLEAR" to confirm
- **Clear warnings** - Multiple warning messages about data loss
- **Comprehensive clearing** - Clears everything including indexes and databases
- **Detailed reporting** - Shows exactly what was cleared
- **Metrics file** - Saves detailed metrics of the nuclear operation

## Use Cases

### Development
```bash
# Clear cache during development
npm run cache:clear
```

### Production Monitoring
```bash
# Check cache usage
npm run cache:stats

# Clear cache if memory usage is high
npm run cache:force

# ☢️  Nuclear option for complete reset
npm run cache:nuclear
```

### Debugging
```bash
# Clear cache and check metrics
npm run cache:clear
# Check the generated metrics file for details
```

## Integration with Application

The cache clearing functions can be imported and used programmatically:

```javascript
const { clearAllCache, getCacheStatistics } = require('./clearAllCache');

// Clear all cache
await clearAllCache();

// Get statistics
await getCacheStatistics();
```

## Troubleshooting

### Common Issues

1. **Connection Error**
   - Check `REDIS_URL` in `.env` file
   - Ensure Redis server is running

2. **Permission Error**
   - Ensure you have write permissions in the directory
   - Check if Redis requires authentication

3. **Memory Not Freed**
   - Some cache types might be recreated immediately
   - Check if application is actively using cache

### Debug Mode

For detailed debugging, you can modify the script to add more logging:

```javascript
// In clearAllCache.js, add:
console.log('Debug: Processing pattern:', cacheType.pattern);
```

## Performance Considerations

- **Large datasets**: The script processes cache types sequentially to avoid memory issues
- **Network latency**: Redis connection time is included in metrics
- **Batch operations**: Uses Redis pipeline operations where possible

## Best Practices

1. **Regular monitoring**: Use `npm run cache:stats` regularly to monitor cache usage
2. **Scheduled clearing**: Consider setting up cron jobs for regular cache clearing
3. **Metrics analysis**: Review the generated metrics files to optimize cache strategies
4. **Backup before clearing**: Consider backing up important cache data before clearing

## API Integration

The cache clearing can be integrated into your API endpoints:

```javascript
// In your API routes
app.post('/api/admin/clear-cache', async (req, res) => {
  try {
    const metrics = await clearAllCache();
    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
``` 