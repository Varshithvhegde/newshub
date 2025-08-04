#!/usr/bin/env node

const { clearAllCacheExceptUser, clearSpecificCacheTypes, getCacheStatistics } = require('../services/cacheClearService');

async function main() {
  const args = process.argv.slice(2);
  
  console.log('🗑️  Redis Cache Clearing Tool (Preserving User Data)');
  console.log('=' .repeat(60));
  
  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node clearCacheExceptUser.js [options]

Options:
  --stats, -s                    Show cache statistics before clearing
  --clear, -c                    Clear all cache except user data (default)
  --specific <types>             Clear specific cache types (comma-separated)
  --help, -h                     Show this help message

Available cache types for --specific:
  articles                       Article data and cache
  article_metrics                Article view metrics and engagement
  search                         Search-related caches
  similar_articles               Similar articles cache
  personalized                   Personalized news cache
  versions                       Version tracking caches
  fallbacks                      Fallback caches
  temp                           Temporary caches
  vectors                        Vector and embedding caches
  search_index                   Search index and metadata

Examples:
  node clearCacheExceptUser.js --stats                    # Show cache statistics
  node clearCacheExceptUser.js --clear                    # Clear all cache except user data
  node clearCacheExceptUser.js --specific articles,search # Clear only articles and search cache
  node clearCacheExceptUser.js                            # Clear all cache except user data (default)

🔒 User data (user:* and user_article_views:*) will always be preserved!
    `);
    return;
  }
  
  // Show statistics
  if (args.includes('--stats') || args.includes('-s')) {
    console.log('📊 Getting cache statistics...\n');
    await getCacheStatistics();
    return;
  }
  
  // Clear specific cache types
  const specificIndex = args.findIndex(arg => arg === '--specific');
  if (specificIndex !== -1 && args[specificIndex + 1]) {
    const cacheTypes = args[specificIndex + 1].split(',').map(type => type.trim());
    console.log(`🧹 Clearing specific cache types: ${cacheTypes.join(', ')}...\n`);
    
    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question(`⚠️  This will clear cache types: ${cacheTypes.join(', ')}\nUser data will be preserved. Are you sure? (y/N): `, resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Cache clearing cancelled.');
      return;
    }
    
    try {
      await clearSpecificCacheTypes(cacheTypes);
      console.log('\n🎉 Specific cache clearing completed successfully!');
    } catch (error) {
      console.error('\n💥 Specific cache clearing failed:', error.message);
      process.exit(1);
    }
    return;
  }
  
  // Clear all cache except user data (default action)
  console.log('🧹 Clearing all Redis cache except user data...\n');
  
  // Ask for confirmation unless --force is specified
  if (!args.includes('--force') && !args.includes('-f')) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('⚠️  This will clear ALL cache data except user data. Are you sure? (y/N): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Cache clearing cancelled.');
      return;
    }
  }
  
  try {
    await clearAllCacheExceptUser();
    console.log('\n🎉 Cache clearing completed successfully!');
    console.log('🔒 User data has been preserved as requested.');
  } catch (error) {
    console.error('\n💥 Cache clearing failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} 