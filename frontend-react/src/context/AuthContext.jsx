import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { getSocket, disconnectSocket } from '../services/socket';
import AuthModal from '../components/auth/AuthModal';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('prent_user') || 'null'); } catch { return null; }
  });

  // Global Auth Modal state
  const [authModalState, setAuthModalState] = useState({
    isOpen: false,
    mode: 'login',
    role: 'tenant',
    promptMessage: '',
  });

  const openAuthModal = useCallback((mode = 'login', role = 'tenant', promptMessage = '') => {
    setAuthModalState({ isOpen: true, mode, role, promptMessage });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const persist = useCallback((token, u) => {
    localStorage.setItem('prent_token', token);
    localStorage.setItem('prent_user', JSON.stringify(u));
    disconnectSocket();
    getSocket();
    setUser(u);
  }, []);

  /**
   * রিফ্রেশ ইউজার স্টেট (refreshUser):
   * ব্যাকএন্ড /api/v1/auth/me থেকে ইউজারের সাম্প্রতিক স্ট্যাটাস (যেমন এডমিন সাসপেন্ড করল কিনা,
   * স্ট্রাইক কাউন্ট বা আনব্লক আপিলের অগ্রগতি) ফেচ করে স্টেট এবং লোকালস্টোরেজ আপডেট করে।
   */
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('prent_token');
    if (!token) return null;
    try {
      const { data } = await api.get('/auth/me');
      if (data?.user) {
        localStorage.setItem('prent_user', JSON.stringify(data.user));
        setUser(data.user);
        return data.user;
      }
    } catch {
      // টোকেন অবৈধ হলে কিছু করবে না
    }
    return null;
  }, []);

  // ১. অ্যাপ লোড হওয়ার সময় ব্যাকএন্ডের সাথে রিয়েল-টাইম ইউজার স্ট্যাটাস সিঙ্ক
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ২. রিয়েল-টাইম সকেট লিসেনার: এডমিন প্যানেল থেকে ব্লক বা সাসপেন্ড করার সাথে সাথে এই ইভেন্ট কার্যকর হয়
  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    if (!socket) return;

    const handleStatusSync = (data) => {
      if (data && (data.userId === user.id || data.user_id === user.id)) {
        console.log('[Socket Realtime] Account status changed:', data);
        setUser((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            account_status: data.account_status,
            strike_count: data.strike_count !== undefined ? data.strike_count : prev.strike_count,
            block_reason: data.block_reason !== undefined ? data.block_reason : prev.block_reason,
            unblock_appeal_status: data.unblock_appeal_status || prev.unblock_appeal_status,
          };
          localStorage.setItem('prent_user', JSON.stringify(updated));
          return updated;
        });

        // কাস্টম ইভেন্ট ফায়ার করা যাতে পুরো অ্যাপ (Navbar, Notifications, TenantHome) সাথে সাথে রিঅ্যাক্ট করে
        window.dispatchEvent(new CustomEvent('prent_user_status_changed', { detail: data }));
        if (data.notification) {
          window.dispatchEvent(new CustomEvent('prent_new_notification', { detail: data.notification }));
        }
      }
    };

    socket.on('account_status_changed', handleStatusSync);
    socket.on('user_status_sync', handleStatusSync);

    return () => {
      socket.off('account_status_changed', handleStatusSync);
      socket.off('user_status_sync', handleStatusSync);
    };
  }, [user?.id]);

  // ৩. ব্যাকগ্রাউন্ড র‍্যাপিড পোলিং (প্রতি ৩.৫ সেকেন্ডে):
  // যদি কোনো কারণে সকেট ডিসকানেক্ট থাকে, তাও ৩.৫ সেকেন্ডের ভেতর এডমিনের ব্লক কমান্ড ক্লায়েন্টে কার্যকর হবে
  useEffect(() => {
    const token = localStorage.getItem('prent_token');
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (data?.user) {
          setUser((prev) => {
            if (!prev) return data.user;
            if (
              prev.account_status !== data.user.account_status ||
              prev.strike_count !== data.user.strike_count ||
              prev.unblock_appeal_status !== data.user.unblock_appeal_status ||
              prev.block_reason !== data.user.block_reason
            ) {
              console.log('[Fast-Poll Sync] Status updated from server:', data.user.account_status);
              localStorage.setItem('prent_user', JSON.stringify(data.user));
              window.dispatchEvent(new CustomEvent('prent_user_status_changed', { detail: data.user }));
              return data.user;
            }
            return prev;
          });
        }
      } catch {
        // quiet poll
      }
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // Step 1: email + mobile → backend sends OTP to the email (passwordless like OYO & Blinkit).
  const login = useCallback(async (email, phone, password = null, role = null) => {
    const { data } = await api.post('/auth/login', { email, phone, password, role });
    return data;
  }, []);

  // Step 2: verify the email OTP → persists the session, returns the user.
  const verifyLoginOtp = useCallback(async (email, code, phone = null, role = null) => {
    const { data } = await api.post('/auth/verify-login-otp', { email, code, phone, role });
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
    <AuthContext.Provider
      value={{
        user,
        setUser,
        refreshUser,
        login,
        verifyLoginOtp,
        signup,
        adminLogin,
        logout,
        isAuthed: Boolean(user),
        authModalState,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
      <AuthModal
        isOpen={authModalState.isOpen}
        onClose={closeAuthModal}
        initialMode={authModalState.mode}
        initialRole={authModalState.role}
        promptMessage={authModalState.promptMessage}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
