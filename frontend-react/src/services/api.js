import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api/v1' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('prent_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('prent_token')) {
      let role = 'TENANT';
      try { role = (JSON.parse(localStorage.getItem('prent_user') || 'null') || {}).role || 'TENANT'; } catch { /* keep default */ }
      localStorage.removeItem('prent_token');
      localStorage.removeItem('prent_user');
      if (!window.location.pathname.startsWith('/auth')) window.location.assign(`/auth?role=${role}`);
    }
    return Promise.reject(err);
  }
);

export default api;
