require('dotenv').config();
const { createClient } = require('redis');

const redis = createClient({ url: process.env.REDIS_URL });

async function clearAllNews() {
  try {
    await redis.connect();
    console.log('Connected to Redis...');

    // Get all news article keys
    const newsKeys = await redis.keys('news:*');
    console.log(`Found ${newsKeys.length} news articles to delete`);

    if (newsKeys.length === 0) {
      console.log('No news articles found to delete.');
      return;
    }

    // Get all related keys to delete
    const allKeys = [
      ...newsKeys,
      ...(await redis.keys('articles:*')),
      ...(await redis.keys('meta:*')),
      ...(await redis.keys('similar:*')),
      ...(await redis.keys('engagement:*')),
      ...(await redis.keys('stats:*')),
      ...(await redis.keys('temp:*')),
      ...(await redis.keys('user:*')),
      ...(await redis.keys('topic:*')),
      ...(await redis.keys('source:*'))
    ];

    console.log(`Total keys to delete: ${allKeys.length}`);

    // Delete all keys in batches
    const batchSize = 100;
    for (let i = 0; i < allKeys.length; i += batchSize) {
      const batch = allKeys.slice(i, i + batchSize);
      if (batch.length > 0) {
        await redis.del(batch);
        console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allKeys.length / batchSize)}`);
      }
    }

    // Drop the search index
    try {
      await redis.ft.dropIndex('idx:news');
      console.log('Dropped search index: idx:news');
    } catch (error) {
      if (error.message.includes('Unknown index name')) {
        console.log('Search index does not exist, skipping...');
      } else {
        console.error('Error dropping search index:', error.message);
      }
    }

    console.log('✅ All news data cleared successfully!');
    console.log(`Deleted ${allKeys.length} keys total`);

  } catch (error) {
    console.error('❌ Error clearing news data:', error);
  } finally {
    await redis.disconnect();
    console.log('Disconnected from Redis');
  }
}

// Execute the script
clearAllNews(); 