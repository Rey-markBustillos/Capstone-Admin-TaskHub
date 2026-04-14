const DEFAULT_LOCAL_API_BASE_URL = 'http://localhost:5000/api';
const DEFAULT_PROD_API_BASE_URL = 'https://capstone-admin-taskhub-2.onrender.com/api';

const normalizeApiBaseUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/+$/, '');
};

const resolveApiBaseUrl = () => {
  const envUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (envUrl) return envUrl;

  const fallback = import.meta.env.DEV
    ? DEFAULT_LOCAL_API_BASE_URL
    : DEFAULT_PROD_API_BASE_URL;

  return normalizeApiBaseUrl(fallback);
};

export const API_BASE_URL = resolveApiBaseUrl();

export const buildApiUrl = (path = '') => {
  const cleanPath = String(path).replace(/^\/+/, '');
  return cleanPath ? `${API_BASE_URL}/${cleanPath}` : API_BASE_URL;
};

if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  console.warn(
    `[api] VITE_API_BASE_URL is not set; using fallback API base URL: ${API_BASE_URL}`
  );
}
