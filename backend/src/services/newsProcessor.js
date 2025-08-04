require('dotenv').config();
const cron = require('node-cron');
const { fetchNews } = require('./newsFetcherService');
const { summarizeAndAnalyze, generateEmbedding, startRateLimitReset, stopRateLimitReset } = require('./geminiService');
const { storeArticle, articleExists, clearAllCacheExceptUser } = require('./redisService');
const crypto = require('crypto');

// Batch processing configuration
const BATCH_SIZE = 5; // Process 5 articles at a time
const BATCH_DELAY = 2000; // 2 seconds between batches

async function processBatch(articles, batchIndex) {
  console.log(`Processing batch ${batchIndex + 1}/${Math.ceil(articles.length / BATCH_SIZE)}`);
  
  const batch = articles.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);
  const promises = batch.map(async (article, index) => {
    try {
      // Use a hash of title+publishedAt as unique ID
      const id = crypto.createHash('sha256').update(article.title + article.publishedAt).digest('hex');
      
      if (await articleExists(id)) {
        console.log(`Skipping duplicate: ${article.title}`);
        return null;
      }

      console.log(`Processing article ${batchIndex * BATCH_SIZE + index + 1}: ${article.title.substring(0, 50)}...`);

      // Process summary and embedding concurrently (using different API keys)
      const [summaryResult, vector] = await Promise.all([
        summarizeAndAnalyze(article.title, article.content || article.description || ''),
        generateEmbedding(`${article.title} ${article.content || article.description || ''}`)
      ]);

      const { summary, sentiment, keywords } = summaryResult;

      const newsObj = {
        id,
        title: article.title,
        content: article.content,
        summary,
        sentiment,
        keywords,
        source: article.source,
        publishedAt: article.publishedAt,
        url: article.url,
        urlToImage: article.urlToImage,
        vector,
        author: article.author || null,
        description: article.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await storeArticle(newsObj);
      console.log(`✓ Stored: ${article.title.substring(0, 50)}...`);
      return newsObj;
    } catch (error) {
      console.error(`Error processing article "${article.title}":`, error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter(result => result !== null);
}

async function processNews() {
  console.log('Starting enhanced news processing...');
  
  // Start the rate limit reset interval
  startRateLimitReset();
  
  // Expanded topics for better coverage
  const topics = [
    'India politics',
    'Technology AI',
    'World news',
    'Sports cricket',
    'Business economy',
    'Entertainment Bollywood',
    'Science research',
    'Health medicine',
    'Environment climate',
    'Education policy'
  ];
  
  const allArticles = [];
  
  // Fetch news for each topic with improved error handling
  for (const topic of topics) {
    try {
      console.log(`Fetching news for: ${topic}`);
      const articles = await fetchNews(topic, 8); // 8 articles per topic
      
      if (articles && articles.length > 0) {
        // Filter out articles with minimal content
        const filteredArticles = articles.filter(article => 
          article.title && 
          article.title.length > 10 &&
          (article.content || article.description) &&
          (article.content || article.description).length > 50
        );
        
        allArticles.push(...filteredArticles);
        console.log(`✓ Fetched ${filteredArticles.length} quality articles for ${topic}`);
      } else {
        console.log(`⚠ No articles found for ${topic}`);
      }
      
      // Small delay between topic fetches to be respectful to NewsAPI
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error fetching news for ${topic}:`, error.message);
    }
  }
  
  console.log(`Total articles fetched: ${allArticles.length}`);
  
  if (allArticles.length === 0) {
    console.log('No articles to process');
    return;
  }

  // Remove duplicates based on title similarity
  const uniqueArticles = [];
  const seenTitles = new Set();
  
  for (const article of allArticles) {
    const normalizedTitle = article.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
    if (!seenTitles.has(normalizedTitle)) {
      seenTitles.add(normalizedTitle);
      uniqueArticles.push(article);
    }
  }
  
  console.log(`Processing ${uniqueArticles.length} unique articles...`);

  // Clear cache if we have more than 30 articles to process
  if (uniqueArticles.length > 30) {
    console.log(`📊 Found ${uniqueArticles.length} articles (more than 30). Clearing cache before processing...`);
    try {
      await clearAllCacheExceptUser();
      console.log('✅ Cache cleared successfully. Proceeding with article processing...');
    } catch (error) {
      console.error('❌ Error clearing cache:', error.message);
      console.log('⚠️  Continuing with article processing despite cache clearing error...');
    }
  } else {
    console.log(`📊 Found ${uniqueArticles.length} articles (30 or fewer). Skipping cache clearing.`);
  }

  // Process articles in batches to manage rate limits
  const totalBatches = Math.ceil(uniqueArticles.length / BATCH_SIZE);
  let processedCount = 0;
  
  for (let i = 0; i < totalBatches; i++) {
    const batchResults = await processBatch(uniqueArticles, i);
    processedCount += batchResults.length;
    
    console.log(`Batch ${i + 1}/${totalBatches} completed. Processed: ${processedCount}/${uniqueArticles.length}`);
    
    // Add delay between batches to respect rate limits
    if (i < totalBatches - 1) {
      console.log(`Waiting ${BATCH_DELAY}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }
  
  console.log(`✅ News processing completed! Successfully processed ${processedCount} articles.`);
  
  // Stop the rate limit reset interval after processing is complete
  stopRateLimitReset();
}

// Enhanced cron scheduling options
function startNewsProcessor(intervalMinutes = 15) {
  const cronExpression = `*/${intervalMinutes} * * * *`;
  console.log(`Scheduling news processor to run every ${intervalMinutes} minutes`);
  
  cron.schedule(cronExpression, async () => {
    console.log(`\n=== Starting scheduled news processing at ${new Date().toISOString()} ===`);
    try {
      await processNews();
    } catch (error) {
      console.error('Error in scheduled news processing:', error);
    }
    console.log(`=== Finished scheduled news processing at ${new Date().toISOString()} ===\n`);
  });
}

// Run once at startup
async function runOnce(exitAfterCompletion = false) {
  console.log('\n=== Running news processor once at startup ===');
  try {
    await processNews();
  } catch (error) {
    console.error('Error in startup news processing:', error);
  }
  console.log('=== Startup news processing completed ===\n');
  // exit the process
  stopRateLimitReset();
  
  if (exitAfterCompletion) {
    console.log('Exiting process as requested...');
    process.exit(0);
  }
}

// Uncomment the line below to run once at startup
// runOnce();

// Uncomment the line below to run once and exit after completion
// runOnce(true);

// Uncomment the line below to start scheduled processing (every 15 minutes)
// startNewsProcessor(15);

module.exports = {
  processNews,
  startNewsProcessor,
  runOnce
};