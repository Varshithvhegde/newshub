// Environment configuration with fallbacks
export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 
      (import.meta.env.PROD ? 'https://summarizely-ai-backend.vercel.app' : 'http://localhost:3001'),
    endpoint: 'api',
  },
  
  // App Configuration
  app: {
    name: 'NewsHub',
    version: '1.0.0',
  },
  
  // Feature Flags
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableDebugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  },
} as const;

// Helper function to get the full API URL
export const getApiUrl = (endpoint: string = ''): string => {
  const baseUrl = config.api.baseUrl;
  const apiEndpoint = config.api.endpoint;
  
  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // Remove leading slash from apiEndpoint if present
  const cleanApiEndpoint = apiEndpoint.startsWith('/') ? apiEndpoint.slice(1) : apiEndpoint;
  
  // Ensure endpoint starts with / if not empty
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Construct URL without double slashes
  const url = `${cleanBaseUrl}/${cleanApiEndpoint}${cleanEndpoint}`;
  // check if it ends with /
  if (url.endsWith('/')) {
    // console.log("URL ends with /", url.slice(0, -1));
    return url.slice(0, -1);
  }
  // console.log("URL does not end with /", url);  
  return url;
};

// Export the full API base URL for backward compatibility
export const API_BASE_URL = getApiUrl(); 