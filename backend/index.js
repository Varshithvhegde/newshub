require('dotenv').config();

// Start the API server
require('./src/app');

// Note: News processing functionality has been moved to src/services/newsProcessor.js
// To enable news processing, uncomment the relevant lines in that file 