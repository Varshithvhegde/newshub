import { API_BASE_URL } from './config';

export interface ArticleMetrics {
  totalViews: number;
  uniqueViews: number;
  userViews: number;
  engagement: number;
  lastViewed: number;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content?: string;
  source: string;
  publishedAt: string;
  url?: string;
  topic: string | { id: string; name: string };
  sentiment: 'positive' | 'negative' | 'neutral';
  author?: string;
  image_url?: string;
  urlToImage?: string;
  metrics?: ArticleMetrics;
  todayViews?: number;
  yesterdayViews?: number;
  growth?: number;
}

export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage: number | null;
  prevPage: number | null;
  totalCount?: number;
  links?: {
    first?: string;
    last?: string;
    next?: string;
    prev?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T;
  pagination: PaginationMetadata;
}

export interface SearchParams {
  q?: string;
  sentiment?: string;
  source?: string;
  topic?: string;
  page?: number;
  limit?: number;
}

export interface UserPreferences {
  topics: string[];
}

export interface PersonalizedSearchParams {
  q?: string;
  sentiment?: string;
  source?: string;
  page?: number;
  limit?: number;
}

class NewsAPI {
  private async fetchJSON<T>(endpoint: string): Promise<T> {
    // console.log("API_BASE_URL along with endpoint", `${API_BASE_URL}${endpoint}`);  
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }
    return response.json();
  }

  private async postJSON<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`Failed to post ${endpoint}: ${response.statusText}`);
    }
    return response.json();
  }

  private async putJSON<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to put ${endpoint}: ${response.statusText}`);
    }
    return response.json();
  }

  async getAllArticles(page: number = 1, limit: number = 12): Promise<PaginatedResponse<Article[]>> {
    return this.fetchJSON<PaginatedResponse<Article[]>>(`/news?page=${page}&limit=${limit}`);
  }

  async getArticleById(id: string, userId: string | null = null): Promise<Article> {
    const headers: HeadersInit = {};
    if (userId) {
      headers['x-user-id'] = userId;
    }
    const response = await fetch(`${API_BASE_URL}/news/${id}`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.statusText}`);
    }
    return response.json();
  }

  async getSimilarArticles(id: string): Promise<Article[]> {
    const response = await this.fetchJSON<{ data: Article[] }>(`/news/${id}/similar`);
    return response.data;
  }

  async getArticlesByTopic(topic: string, page: number = 1, limit: number = 12): Promise<PaginatedResponse<Article[]>> {
    return this.fetchJSON<PaginatedResponse<Article[]>>(`/news/topic/${topic}?page=${page}&limit=${limit}`);
  }

  async getArticlesBySentiment(sentiment: string, page: number = 1, limit: number = 12): Promise<PaginatedResponse<Article[]>> {
    return this.fetchJSON<PaginatedResponse<Article[]>>(`/news/sentiment/${sentiment}?page=${page}&limit=${limit}`);
  }

  async searchArticles(params: SearchParams): Promise<PaginatedResponse<Article[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    
    return this.fetchJSON<PaginatedResponse<Article[]>>(`/news/search?${searchParams.toString()}`);
  }

  async getTopics(): Promise<string[]> {
    return this.fetchJSON<string[]>('/metadata/topics');
  }

  async getSentiments(): Promise<string[]> {
    return this.fetchJSON<string[]>('/metadata/sentiments');
  }

  async getSources(): Promise<string[]> {
    return this.fetchJSON<string[]>('/metadata/sources');
  }

  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return this.fetchJSON<{ status: string; timestamp: string }>('/health');
  }

  async getTrendingArticles(limit: number = 10): Promise<{ trendingArticles: Article[]; totalCount: number; timestamp: string }> {
    return this.fetchJSON<{ trendingArticles: Article[]; totalCount: number; timestamp: string }>(`/news/trending?limit=${limit}`);
  }

  // User Management APIs
  async generateUserId(): Promise<{ userId: string }> {
    return this.postJSON<{ userId: string }>('/user/generate-id');
  }

  async storeUserPreferences(userId: string, preferences: UserPreferences): Promise<{ success: boolean }> {
    return this.postJSON<{ success: boolean }>(`/user/${userId}/preferences`, preferences);
  }

  async getUserPreferences(userId: string): Promise<UserPreferences> {
    return this.fetchJSON<UserPreferences>(`/user/${userId}/preferences`);
  }

  async updateUserPreferences(userId: string, preferences: UserPreferences): Promise<{ success: boolean }> {
    return this.putJSON<{ success: boolean }>(`/user/${userId}/preferences`, preferences);
  }

  // Personalized Feed APIs
  async getPersonalizedNews(userId: string, page: number = 1, limit: number = 12): Promise<PaginatedResponse<Article[]>> {
    return this.fetchJSON<PaginatedResponse<Article[]>>(`/user/${userId}/personalized-news?page=${page}&limit=${limit}`);
  }

  async searchPersonalizedNews(userId: string, params: PersonalizedSearchParams): Promise<PaginatedResponse<Article[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    
    return this.fetchJSON<PaginatedResponse<Article[]>>(`/user/${userId}/personalized-news/search?${searchParams.toString()}`);
  }
}

export const newsAPI = new NewsAPI();