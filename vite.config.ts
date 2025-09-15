import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_DB_HOST': JSON.stringify(process.env.DB_HOST),
    'import.meta.env.VITE_DB_PORT': JSON.stringify(process.env.DB_PORT),
    'import.meta.env.VITE_DB_NAME': JSON.stringify(process.env.DB_NAME),
    'import.meta.env.VITE_DB_USER': JSON.stringify(process.env.DB_USER),
    'import.meta.env.VITE_DB_PASSWORD': JSON.stringify(process.env.DB_PASSWORD),
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});