import axios from 'axios';

// Normalise la base d'URL pour garantir le suffixe /api
function getBaseURL(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return 'http://localhost:5000/api';  // <-- ici le fallback
  ...
}
    const u = new URL(raw);
    const pathname = u.pathname.replace(/\/+$/, '');
    if (pathname.toLowerCase().endsWith('/api')) {
      return raw; // déjà correct
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
