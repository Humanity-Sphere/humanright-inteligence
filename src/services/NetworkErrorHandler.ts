import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import ErrorHandlingService from './ErrorHandlingService';

/**
 * Service for handling network-related errors
 */
class NetworkErrorHandler {
  /**
   * Check if the device is currently connected to the internet
   * @returns {Promise<boolean>} True if connected, false otherwise
   */
  async isConnected(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected || false;
    } catch (error) {
      console.error('Error checking network connection:', error);
      return false;
    }
  }

  /**
   * Handle network errors based on the current connection state
   * @param {any} error The error to handle
   * @returns {string} Error message
   */
  async handleNetworkError(error: any): Promise<string> {
    const isConnected = await this.isConnected();

    if (!isConnected) {
      return ErrorHandlingService.handleOfflineError();
    }

    return ErrorHandlingService.handleApiError(error, 'Netzwerkfehler');
  }

  /**
   * Retry a function with exponential backoff
   * @param {Function} fn Function to retry
   * @param {number} maxRetries Maximum number of retries
   * @param {number} initialDelay Initial delay in ms
   * @returns {Promise<any>} Result of the function
   */
  async retryWithBackoff(fn: Function, maxRetries = 3, initialDelay = 1000): Promise<any> {
    let retries = 0;
    let delay = initialDelay;

    while (retries < maxRetries) {
      try {
        return await fn();
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
}

export default new NetworkErrorHandler();