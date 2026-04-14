import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const fallbackApiBaseUrl = mode === 'development'
    ? 'http://localhost:5000/api'
    : 'https://capstone-admin-taskhub-2.onrender.com/api';
  const apiBaseUrl = env.VITE_API_BASE_URL || fallbackApiBaseUrl;

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl)
    }
  };
})
