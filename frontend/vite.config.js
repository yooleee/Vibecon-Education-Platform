import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: [
      'lecture-ai.preview.emergentagent.com',
      '.preview.emergentagent.com',
      'localhost'
    ]
  },
  define: {
    // Expose REACT_APP_ variables for compatibility with existing code
    'process.env.REACT_APP_BACKEND_URL': JSON.stringify(process.env.REACT_APP_BACKEND_URL || 'https://tutor-chat-ai.preview.emergentagent.com'),
    'process.env.REACT_APP_GOOGLE_CLIENT_ID': JSON.stringify(process.env.REACT_APP_GOOGLE_CLIENT_ID || '1080095233905-rtm89un5d1lsgh6ro8m3qtk1omojqop0.apps.googleusercontent.com'),
  },
  envPrefix: ['VITE_', 'REACT_APP_'], // Allow both prefixes
})
