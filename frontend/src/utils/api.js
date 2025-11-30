import axios from 'axios';

// Build baseURL and ensure it ends with a trailing slash so relative paths concatenate safely
const getBaseURL = () => {
  let envURL = process.env.REACT_APP_API_URL;
  if (envURL) {
    // If envURL points to a root like 'http://host' append 'api' if missing
    if (envURL.endsWith('/api/')) return envURL;
    if (envURL.endsWith('/api')) envURL = `${envURL}/`;
    else if (envURL.endsWith('/')) envURL = `${envURL}api/`;
    else envURL = `${envURL}/api/`;
    return envURL;
  }
  return 'http://localhost:5000/api/';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData, let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    // Log the full URL for debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove token locally
      localStorage.removeItem('token');
      // Instead of forcing a hard navigation (which reloads the page),
      // dispatch a custom event so the React app can handle navigation
      // via its router (no full page refresh).
      try {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      } catch (e) {
        // Fallback: if CustomEvent isn't available for some reason, use a plain event
        window.dispatchEvent(new Event('unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;

