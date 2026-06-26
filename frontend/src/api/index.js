import axios from 'axios';

const api = axios.create({
  baseURL: `http://${window.location.hostname}:5000/api`,
});

// Auth token
api.interceptors.request.use(async (config) => {
  try {
    let attempts = 0;
    while (!window.Clerk?.session && attempts < 10) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }

    if (window.Clerk?.session) {
      const token = await window.Clerk.session.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.error('Auth Error:', err);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auth status
api.interceptors.response.use(
  (response) => {
    window.dispatchEvent(new CustomEvent('palm-auth-status', { detail: { secure: true } }));
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('palm-auth-status', { detail: { secure: false } }));
    }
    return Promise.reject(error);
  }
);

export default api;
