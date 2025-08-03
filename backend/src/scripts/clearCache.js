#!/usr/bin/env node

const { clearAllCache, getCacheStatistics, clearEverythingInRedis, getCompleteRedisStatistics } = require('./clearAllCache');

async function main() {
  const args = process.argv.slice(2);
  
  console.log('🗑️  Redis Cache Management Tool');
  console.log('=' .repeat(40));
  
  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node clearCache.js [options]

Options:
  --stats, -s           Show cache statistics before clearing
  --clear, -c           Clear all cache (default)
  --nuclear, -n         ☢️  NUCLEAR: Clear EVERYTHING in Redis
  --complete-stats      Show complete Redis statistics
  --help, -h            Show this help message

Examples:
  node clearCache.js --stats           # Show cache statistics
  node clearCache.js --clear           # Clear all cache
  node clearCache.js --nuclear         # ☢️  Clear EVERYTHING in Redis
  node clearCache.js --complete-stats  # Show complete Redis statistics
  node clearCache.js                   # Clear all cache (default)

⚠️  WARNING: --nuclear option will clear ALL data in Redis!
    This includes all keys, indexes, configurations, and databases.
    This action cannot be undone!
    `);
    return;
  }
  
  // Show statistics
  if (args.includes('--stats') || args.includes('-s')) {
    console.log('📊 Getting cache statistics...\n');
    await getCacheStatistics();
    return;
  }
  
  // Show complete statistics
  if (args.includes('--complete-stats')) {
    console.log('📊 Getting complete Redis statistics...\n');
    await getCompleteRedisStatistics();
    return;
  }
  
  // Nuclear option
  if (args.includes('--nuclear') || args.includes('-n')) {
    console.log('☢️  NUCLEAR OPTION SELECTED!\n');
    
    // Extra confirmation for nuclear option
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('⚠️  ⚠️  ⚠️  NUCLEAR WARNING ⚠️  ⚠️  ⚠️\n' +
                 'This will clear EVERYTHING in Redis!\n' +
                 'All data, indexes, configurations will be DELETED!\n' +
                 'This action cannot be undone!\n\n' +
                 'Type "NUCLEAR" to confirm: ', resolve);
    });
    
    rl.close();
    
    if (answer !== 'NUCLEAR') {
      console.log('❌ Nuclear clearing cancelled.');
      return;
    }
    
    try {
      await clearEverythingInRedis();
      console.log('\n☢️  Nuclear clearing completed successfully!');
    } catch (error) {
      console.error('\n💥 Nuclear clearing failed:', error.message);
      process.exit(1);
    }
    return;
  }
  
  // Clear cache (default action)
  console.log('🧹 Clearing all Redis cache...\n');
  
  // Ask for confirmation unless --force is specified
  if (!args.includes('--force') && !args.includes('-f')) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('⚠️  This will clear ALL cache data. Are you sure? (y/N): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Cache clearing cancelled.');
      return;
    }
  }
  
  try {
    await clearAllCache();
    console.log('\n🎉 Cache clearing completed successfully!');
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