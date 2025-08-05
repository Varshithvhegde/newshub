const { clearAllCacheExceptUser } = require('./src/services/cacheClearService');

async function testCacheClearing() {
  console.log('🧪 Testing cache clearing functionality...\n');
  
  try {
    // Test the cache clearing function
    const result = await clearAllCacheExceptUser();
    
    console.log('\n✅ Cache clearing test completed successfully!');
    console.log('📊 Results:');
    console.log(`   Total keys cleared: ${result.totalKeysCleared}`);
    console.log(`   User data preserved: ${result.preservedUserData}`);
    console.log(`   Cache types cleared: ${Object.keys(result.cacheTypes).length}`);
    
    // Check if article_user_views and user_article_views were included
    const clearedTypes = Object.keys(result.cacheTypes);
    const hasArticleUserViews = clearedTypes.some(type => type.includes('Article User Views'));
    const hasUserArticleViews = clearedTypes.some(type => type.includes('User Article Views'));
    
    console.log('\n🔍 Verification:');
    console.log(`   Article User Views cleared: ${hasArticleUserViews ? '✅' : '❌'}`);
    console.log(`   User Article Views cleared: ${hasUserArticleViews ? '✅' : '❌'}`);
    
    if (hasArticleUserViews && hasUserArticleViews) {
      console.log('\n🎉 SUCCESS: Both article_user_views and user_article_views are now being cleared!');
    } else {
      console.log('\n⚠️  WARNING: Some view patterns may not be cleared properly.');
    }
    
  } catch (error) {
    console.error('❌ Error during cache clearing test:', error);
  }
}

// Run the test
testCacheClearing(); 