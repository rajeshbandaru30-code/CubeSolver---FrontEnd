import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://cubesolve-backend.onrender.com/api',
  timeout: 120000, // 120s timeout allowing free-tier instances (Render) to wake from cold sleep
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token to headers
api.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: performance.now() };
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

// Response interceptor for handling common errors and safe performance monitoring
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV && response.config?.metadata) {
      const clientDuration = (performance.now() - response.config.metadata.startTime).toFixed(1);
      const serverTiming = response.headers?.['server-timing'] || response.headers?.get?.('server-timing');
      if (serverTiming) {
        console.debug(`[Perf] ${response.config.method?.toUpperCase()} ${response.config.url} took ${clientDuration}ms (Server-Timing: ${serverTiming})`);
      }
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-error'));
    }
    return Promise.reject(error);
  }
);

export default api;
