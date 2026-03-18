import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 🔥 Подключаем новый движок

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 🔥 Активируем
  ],
})