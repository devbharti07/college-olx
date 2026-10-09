import React, { useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { AuthContext } from './AuthContextObject';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => authService.getToken());
  const [isLoading, setIsLoading] = useState(true);

  // Restore authenticated session on mount
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const storedToken = authService.getToken();
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await authService.getMe();
        if (isMounted && response?.user) {
          setUser(response.user);
          setToken(storedToken);
        }
      } catch {
        // Token expired or invalid
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    if (data?.user) {
      setUser(data.user);
      setToken(data.token || authService.getToken());
    }
    return data;
  }, []);

  const register = useCallback(async (registrationData) => {
    const data = await authService.register(registrationData);
    if (data?.user) {
      setUser(data.user);
      setToken(data.token || authService.getToken());
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authService.getMe();
      if (data?.user) {
        setUser(data.user);
      }
      return data?.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user),
    isVerified: Boolean(user?.isVerified),
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
