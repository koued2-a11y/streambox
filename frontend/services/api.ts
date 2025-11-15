import axios from 'axios';

// Normalise la base d'URL pour garantir le suffixe /api
function getBaseURL(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  // Valeur par défaut si la variable d'environnement n'est pas définie
  if (!raw) return 'https://streambox-1m7t.onrender.com/api';

  try {
    const u = new URL(raw);
    const pathname = u.pathname.replace(/\/+$/, '');
    if (pathname.toLowerCase().endsWith('/api')) {
      return `${u.origin}${pathname}`;
    }
    const normalized = `${u.origin}${pathname ? pathname : ''}/api`;
    return normalized;
  } catch {
    // raw peut ne pas être une URL complète; fallback simple
    const trimmed = raw.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      // tenter un refresh via le cookie (endpoint /auth/refresh)
      return axios.post(`${getBaseURL()}/auth/refresh`, {}, { withCredentials: true })
        .then((resp) => {
          const newToken = resp.data?.token;
          if (newToken) {
            localStorage.setItem('token', newToken);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          }
          localStorage.removeItem('token');
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        })
        .catch(() => {
          localStorage.removeItem('token');
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        });
    }
    return Promise.reject(error);
  }
);

export default api;
