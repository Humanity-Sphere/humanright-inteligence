
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import ErrorHandlingService from './ErrorHandlingService';

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request-Interceptor
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response-Interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Wenn der Fehler ein 401 ist (Unauthorized) und wir nicht bereits versuchen, das Token zu aktualisieren
        if (error.response?.status === 401 && !originalRequest._retry && !this.isRefreshing) {
          if (originalRequest._retry) {
            // Wenn wir bereits versucht haben, das Token zu aktualisieren, melden wir den Benutzer ab
            await this.handleLogout();
            return Promise.reject(error);
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Versuche, ein neues Token zu erhalten
            const newToken = await this.refreshToken();
            
            if (newToken) {
              // Wenn wir ein neues Token erhalten haben, aktualisieren wir es und wiederholen die Anfrage
              await AsyncStorage.setItem('authToken', newToken);
              this.api.defaults.headers.Authorization = `Bearer ${newToken}`;
              
              // Stelle die ursprüngliche Anfrage mit dem neuen Token neu
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              
              // Informiere alle wartenden Anfragen
              this.refreshSubscribers.forEach(callback => callback(newToken));
              this.refreshSubscribers = [];
              
              return this.api(originalRequest);
            } else {
              // Wenn wir kein neues Token erhalten, melden wir den Benutzer ab
              this.handleLogout();
              return Promise.reject(new Error('Sitzung abgelaufen. Bitte erneut anmelden.'));
            }
          } catch (refreshError) {
            // Wenn wir einen Fehler beim Aktualisieren des Tokens erhalten, melden wir den Benutzer ab
            await this.handleLogout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Für Netzwerkfehler
        if (!error.response) {
          ErrorHandlingService.handleOfflineError();
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        return null;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data?.token) {
        return response.data.token;
      }

      return null;
    } catch (error) {
      console.error('Fehler beim Token-Refresh:', error);
      return null;
    }
  }

  private async handleLogout() {
    try {
      // Löschen Sie die Token aus dem AsyncStorage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      
      // Löschen Sie den Auth-Header
      delete this.api.defaults.headers.Authorization;
      
      // Zeigen Sie eine Benachrichtigung an
      ErrorHandlingService.handleAuthError();
      
      // Hier könnten Sie einen Event auslösen, der die App zur Login-Seite umleitet
      // z.B. EventEmitter.emit('logout');
    } catch (error) {
      console.error('Fehler beim Logout:', error);
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.get<T>(url, config);
      return response.data;
    } catch (error) {
      ErrorHandlingService.handleApiError(error, 'Fehler beim Abrufen von Daten');
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      ErrorHandlingService.handleApiError(error, 'Fehler beim Senden von Daten');
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      ErrorHandlingService.handleApiError(error, 'Fehler beim Aktualisieren von Daten');
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.delete<T>(url, config);
      return response.data;
    } catch (error) {
      ErrorHandlingService.handleApiError(error, 'Fehler beim Löschen von Daten');
      throw error;
    }
  }
}

export default new ApiService();
