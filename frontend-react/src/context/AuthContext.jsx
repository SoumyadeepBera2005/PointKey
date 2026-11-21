import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';
import { disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('prent_user') || 'null'); } catch { return null; }
  });

  const persist = useCallback((token, u) => {
    localStorage.setItem('prent_token', token);
    localStorage.setItem('prent_user', JSON.stringify(u));
    setUser(u);
  }, []);

  // Step 1: email + mobile + password → backend sends OTP to the email.
  // Returns { otp_required, email, dev_otp?, message } — no token yet.
  const login = useCallback(async (email, phone, password, role) => {
    const { data } = await api.post('/auth/login', { email, phone, password, role });
    return data;
  }, []);

  // Step 2: verify the email OTP → persists the session, returns the user.
  const verifyLoginOtp = useCallback(async (email, code, role) => {
    const { data } = await api.post('/auth/verify-login-otp', { email, code, role });
    persist(data.token, data.user);
    return data.user;
  }, [persist]);

  const signup = useCallback(async (payload) => {
    const { data } = await api.post('/auth/signup', payload);
    persist(data.token, data.user);
    return data.user;
  }, [persist]);

  const adminLogin = useCallback(async (email, password, mfaCode) => {
    const { data } = await api.post('/auth/admin/login', { email, password, mfa_code: mfaCode });
    persist(data.token, data.user);
    return data.user;
  }, [persist]);

  const logout = useCallback(() => {
    localStorage.removeItem('prent_token');
    localStorage.removeItem('prent_user');
    disconnectSocket();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, login, verifyLoginOtp, signup, adminLogin, logout, isAuthed: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
