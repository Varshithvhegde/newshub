// Environment variable validation and debugging
import { config } from './config';

export const validateEnvironment = () => {
  const issues: string[] = [];
  
  // Check if API base URL is accessible
  if (!config.api.baseUrl) {
    issues.push('VITE_API_BASE_URL is not set, using fallback');
  }
  
  // Log configuration in development
  if (import.meta.env.DEV) {
    console.log('🔧 Environment Configuration:', {
      apiBaseUrl: config.api.baseUrl,
      apiEndpoint: config.api.endpoint,
      fullApiUrl: config.api.baseUrl + config.api.endpoint,
      enableAnalytics: config.features.enableAnalytics,
      debugMode: config.features.enableDebugMode,
    });
  }
  
  if (issues.length > 0) {
    console.warn('⚠️ Environment Issues:', issues);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
};

// Auto-validate on import in development
if (import.meta.env.DEV) {
  validateEnvironment();
} 