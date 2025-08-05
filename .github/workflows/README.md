# GitHub Workflows

This directory contains GitHub Actions workflows for automated tasks in the NewsHub project.

## News Processor Workflow

The `news-processor.yml` workflow automatically fetches and processes news articles every 4 hours.

### Features

- **Scheduled Execution**: Runs every 4 hours using cron schedule
- **Manual Trigger**: Can be manually triggered from GitHub Actions tab
- **Environment Setup**: Automatically configures Node.js and dependencies
- **Redis Monitoring**: Checks Redis connection and provides statistics
- **Processing Reports**: Generates detailed reports after each run

### Setup Instructions

#### 1. Configure GitHub Environment Secrets

Add the following secrets in your GitHub repository:

1. Go to your repository → Settings → Environments
2. Create a new environment called `NEWSAPI_KEY`
3. Add the following environment secrets:

```
REDIS_URL=redis://your-redis-instance:6379
GEMINI_API_KEY=your_gemini_api_key_here
NEWSAPI_KEY=your_newsapi_key_here
```

#### 2. Required Environment Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `GEMINI_API_KEY` | Google Gemini AI API key | `AIzaSyC...` |
| `NEWSAPI_KEY` | NewsAPI.org API key | `1234567890abcdef...` |

**Note**: These secrets must be added to the `NEWSAPI_KEY` environment, not as repository secrets.

#### 3. Workflow Schedule

The workflow runs automatically every 4 hours at:
- 00:00 UTC
- 04:00 UTC
- 08:00 UTC
- 12:00 UTC
- 16:00 UTC
- 20:00 UTC

#### 4. Manual Execution

To run the workflow manually:

1. Go to Actions tab in your repository
2. Select "News Processor - Automated News Fetching"
3. Click "Run workflow"
4. Optionally enable "Force run" if needed

### Workflow Jobs

#### 1. Fetch and Process News Articles

- **Purpose**: Main job that runs the news processor
- **Steps**:
  - Checkout repository
  - Setup Node.js 18
  - Install dependencies
  - Configure environment variables
  - Run `addNews.js` script
  - Log completion

#### 2. Monitor News Processing

- **Purpose**: Monitor and report on the processing job
- **Steps**:
  - Check Redis connection
  - Display Redis statistics
  - Generate processing report
  - Always runs (even if main job fails)

### Monitoring and Logs

#### Viewing Logs

1. Go to Actions tab in your repository
2. Click on "News Processor - Automated News Fetching"
3. Click on the latest run
4. View detailed logs for each step

#### Redis Statistics

The workflow automatically checks:
- Redis connection status
- Total keys in database
- Memory usage
- Processing success/failure

### Troubleshooting

#### Common Issues

1. **Redis Connection Failed**
   - Check `REDIS_URL` secret is correct
   - Ensure Redis instance is accessible
   - Verify network connectivity

2. **API Key Errors**
   - Verify `GEMINI_API_KEY` and `NEWSAPI_KEY` are valid
   - Check API quotas and limits
   - Ensure keys have proper permissions

3. **Dependency Issues**
   - Check `backend/package-lock.json` exists
   - Verify all dependencies are listed in `package.json`
   - Clear npm cache if needed

#### Debug Mode

To debug issues:

1. Run workflow manually
2. Check logs for specific error messages
3. Verify environment variables are set correctly
4. Test Redis connection locally

### Performance Considerations

- **Execution Time**: Typically 5-10 minutes per run
- **Resource Usage**: Moderate CPU and memory usage
- **API Limits**: Respects NewsAPI.org and Gemini API rate limits
- **Redis Impact**: Minimal impact on Redis performance

### Customization

#### Modify Schedule

To change the schedule, edit the cron expression in `news-processor.yml`:

```yaml
schedule:
  # Run every 6 hours instead of 4
  - cron: '0 */6 * * *'
```

#### Add More Jobs

To add additional processing jobs:

1. Create new job in the workflow
2. Add appropriate steps
3. Configure dependencies between jobs
4. Update monitoring as needed

### Security Notes

- All sensitive data is stored as GitHub secrets
- Environment variables are not logged
- Redis connection uses secure URLs
- API keys are properly masked in logs

---

For more information about the news processing logic, see `backend/addNews.js` and `backend/src/services/newsProcessor.js`. 