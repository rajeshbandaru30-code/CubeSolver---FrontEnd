import React, { createContext, useState, useEffect, useContext } from 'react';
import { authApi } from '../api/cubeApi';

export const AuthContext = createContext();

// Convenience hook
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);

    const handleAuthError = () => setUser(null);
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  /**
   * Register a new user. Returns { success, message }.
   */
  const register = async (username, email, password) => {
    try {
      const res = await authApi.register(username, email, password);
      if (res.data.success) {
        // Auto-login after registration
        const userData = { username: res.data.username, email: res.data.email };
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Registration failed.' };
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Registration failed. Please try again.';
      if (data?.errors) {
        msg = Object.values(data.errors).join(' ');
      } else if (data?.message) {
        msg = data.message;
      }
      return { success: false, message: msg };
    }
  };

  /**
   * Login. Returns { success, message }.
   */
  const login = async (username, password) => {
    try {
      const res = await authApi.login(username, password);
      if (res.data.success) {
        const userData = { username: res.data.username, email: res.data.email };
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Login failed.' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Invalid credentials.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
