const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
    isLocalHost
        ? 'http://localhost:5001'
        : 'https://realestate-platform-gp6u.onrender.com'
);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${BACKEND_URL}/api`;

export { BACKEND_URL, API_BASE_URL };
export default API_BASE_URL;
