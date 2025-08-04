import { newsAPI } from './api';

const USER_ID_KEY = 'ai_news_user_id';
const USER_PREFERENCES_KEY = 'ai_news_user_preferences';

export interface UserPreferences {
  topics: string[];
}

export class UserManager {
  static async getUserId(): Promise<string> {
    let userId = localStorage.getItem(USER_ID_KEY);
    console.log(userId);
    if (!userId) {
      try {
        const response = await newsAPI.generateUserId();
        userId = response.userId;
        localStorage.setItem(USER_ID_KEY, userId);
      } catch (error) {
        console.error('Failed to generate user ID:', error);
        throw error;
      }
    }
    
    return userId;
  }

  static getUserPreferences(): UserPreferences | null {
    const preferences = localStorage.getItem(USER_PREFERENCES_KEY);
    return preferences ? JSON.parse(preferences) : null;
  }

  static setUserPreferences(preferences: UserPreferences): void {
    localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
  }

  static async syncPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    try {
      await newsAPI.storeUserPreferences(userId, preferences);
      this.setUserPreferences(preferences);
    } catch (error) {
      console.error('Failed to sync preferences:', error);
      throw error;
    }
  }

  static async updatePreferences(userId: string, preferences: UserPreferences): Promise<void> {
    try {
      await newsAPI.updateUserPreferences(userId, preferences);
      this.setUserPreferences(preferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }

  static async loadPreferencesFromServer(userId: string): Promise<UserPreferences | null> {
    try {
      const serverPreferences = await newsAPI.getUserPreferences(userId);
      if (serverPreferences) {
        this.setUserPreferences(serverPreferences);
        return serverPreferences;
      }
      return null;
    } catch (error) {
      console.error('Failed to load preferences from server:', error);
      return null;
    }
  }

  static hasPreferences(): boolean {
    const preferences = this.getUserPreferences();
    return preferences !== null && preferences.topics.length > 0;
  }

  static clearUser(): void {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_PREFERENCES_KEY);
  }
}