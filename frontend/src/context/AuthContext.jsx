import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('lumen_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Check current user session with token
  const checkAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('lumen_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.getMe();
      if (response.data?.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        localStorage.removeItem('lumen_token');
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.warn('[Lumen AuthContext] Session verification failed:', error.response?.data?.message || error.message);
      localStorage.removeItem('lumen_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { success, token: newToken, user: userData, message } = response.data;

      if (success && newToken) {
        localStorage.setItem('lumen_token', newToken);
        setToken(newToken);
        setUser(userData);
        return { success: true, user: userData, message };
      }
      return { success: false, message: message || 'Login failed' };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message };
    }
  };

  // Switch demo persona instantly
  const switchDemoUser = async (demoEmail) => {
    const pwd = 'password123';
    return await login(demoEmail, pwd);
  };

  // Register handler
  const register = async (name, email, password, role = 'reader', bio = '') => {
    try {
      const response = await authAPI.register({ name, email, password, role, bio });
      const { success, message, user: createdUser } = response.data;

      if (success) {
        return {
          success: true,
          message: message || 'Account registered successfully. Please sign in.',
          user: createdUser,
        };
      }
      return { success: false, message: message || 'Registration failed' };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Registration failed. Please check your details.';
      return { success: false, message };
    }
  };

  // Update profile handler
  const updateProfile = async (profileData) => {
    try {
      const response = await userAPI.updateProfile(profileData);
      if (response.data?.success && response.data?.user) {
        setUser(response.data.user);
        return { success: true, user: response.data.user, message: response.data.message };
      }
      return { success: false, message: response.data?.message || 'Update failed' };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile.';
      return { success: false, message };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('lumen_token');
      setToken(null);
      setUser(null);
    }
  };

  const isAuthenticated = !!user && !!token;
  const isReader = user?.role === 'reader';
  const isAuthor = user?.role === 'author' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        isReader,
        isAuthor,
        isAdmin,
        login,
        switchDemoUser,
        register,
        logout,
        updateProfile,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
