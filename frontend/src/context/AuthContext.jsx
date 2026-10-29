import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, authStorage } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authStorage.getUser());
  const [token, setToken] = useState(authStorage.getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (authStorage.getToken()) {
        try {
          const res = await api.getMe();
          if (res?.user) {
            setUser(res.user);
            authStorage.setUser(res.user);
          }
        } catch {
          // Token invalid or expired
          authStorage.clear();
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setUser(res.user);
    setToken(res.token);
    return res;
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    role: user?.role || 'teacher',
    isAdmin: user?.role === 'admin',
    isPrincipal: user?.role === 'principal',
    isChairman: user?.role === 'chairman',
    isTeacher: user?.role === 'teacher',
    assignedSubjects: user?.assigned_subjects || [],
    isAuthenticated: !!token,
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
