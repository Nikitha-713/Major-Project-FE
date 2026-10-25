import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axiosInstance from '../axiosInstance.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, restore the session if a token is saved.
  useEffect(() => {
    const token = localStorage.getItem('unfazed_token');
    if (!token) {
      setLoading(false);
      return;
    }
    axiosInstance
      .get('/auth/me')
      .then((res) => setTherapist(res.data.therapist))
      .catch(() => localStorage.removeItem('unfazed_token'))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = ({ token, therapist: t }) => {
    localStorage.setItem('unfazed_token', token);
    setTherapist(t);
  };

  const login = useCallback(async (email, password) => {
    const res = await axiosInstance.post('/auth/login', { email, password });
    saveSession(res.data);
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await axiosInstance.post('/auth/register', { name, email, password });
    saveSession(res.data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('unfazed_token');
    setTherapist(null);
  }, []);

  return (
    <AuthContext.Provider value={{ therapist, setTherapist, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
