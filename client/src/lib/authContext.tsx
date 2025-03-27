import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@shared/schema';
import { apiRequest } from './queryClient';

interface AuthContextProps {
  user: Omit<User, 'password'> | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  isAuthenticated: false,
  clearError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load current user on initial render
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await apiRequest('GET', '/api/user/current');
        const data = await response.json();
        setUser(data);
      } catch (err) {
        console.log('Kein Benutzer angemeldet oder Sitzung abgelaufen');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Anmeldung fehlgeschlagen');
      }
      
      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registrierung fehlgeschlagen');
      }
      
      const newUser = await response.json();
      setUser(newUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    
    try {
      await apiRequest('POST', '/api/auth/logout');
      setUser(null);
    } catch (err) {
      console.error('Fehler beim Abmelden:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
