import axios from 'axios';

// Build baseURL without trailing slash to prevent double slashes
// const getBaseURL = () => {
//   let envURL = process.env.REACT_APP_API_URL;
//   if (envURL) {
//     // Remove trailing slash if present
//     envURL = envURL.replace(/\/+$/, '');
//     // Ensure it ends with /api (no trailing slash)
//     if (envURL.endsWith('/api')) {
//       return envURL;
//     } else if (envURL.endsWith('/api/')) {
//       return envURL.slice(0, -1); // Remove trailing slash
//     } else {
//       return `${envURL}/api`;
//     }
//   }
//   // Default: no trailing slash
//   return 'http://localhost:5000/api';
// };

const getBaseURL = () => {
  const envURL = process.env.REACT_APP_API_URL;
  if (envURL) {
    return envURL.endsWith('/api') ? envURL : envURL.replace(/\/+$/, '') + '/api';
  }
  // Fallback: use production URL if in production, otherwise localhost
  if (process.env.NODE_ENV === 'production') {
    return 'https://employee-attendance-system-59im.onrender.com/api';
  }
  return 'http://localhost:5000/api';
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
    const fullURL = `${config.baseURL}/${config.url}`.replace(/([^:]\/)\/+/g, '$1');
    console.log(`API Request: ${config.method?.toUpperCase()} ${fullURL}`);
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
      // Remove token locally - React Router will handle navigation via PrivateRoute
      localStorage.removeItem('token');
      // Don't dispatch events or reload - let Redux state changes trigger navigation
    }
    return Promise.reject(error);
  }
);

export default api;
