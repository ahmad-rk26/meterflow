import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL
});

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('tokenExpiry');

    // Client-side expiry check — clear before even sending the request
    if (token && expiry && Date.now() > parseInt(expiry)) {
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired'));
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-clear token on any 401 response
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearAuth();
            // Only redirect if not already on auth pages
            const path = window.location.pathname;
            if (!['/login', '/register', '/forgot-password', '/'].includes(path)) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username');
    localStorage.removeItem('tokenExpiry');
};

// Call this after login/register to set token + expiry (7 days)
export const setAuth = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('username', user.username);
    localStorage.setItem('tokenExpiry', Date.now() + 7 * 24 * 60 * 60 * 1000);
};

export default api;
