
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('sb_token'));
  const [loading, setLoading] = useState(true);

  // On mount, verify the stored token is still valid
  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/auth/me');
        setUser(res.data.user);
      } catch {
        // Token invalid or expired — clear it
        localStorage.removeItem('sb_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []); // runs once on mount only

  const signIn = useCallback(async (email, password) => {
    const res = await apiClient.post('/auth/signin', { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('sb_token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser; // caller uses this for redirect
  }, []);

  const signUp = useCallback(async (formData) => {
    const res = await apiClient.post('/auth/signup', formData);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('sb_token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiClient.post('/auth/signout');
    } catch {
      // Even if the server call fails, clear local state
    }
    localStorage.removeItem('sb_token');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user, // null if not signed in
    token, // JWT string or null
    loading, // true during initial session restore
    isSignedIn: !!user,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
