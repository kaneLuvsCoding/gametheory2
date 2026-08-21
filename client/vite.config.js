import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure Public folder is correctly resolved on case-sensitive Linux (Vercel)
const publicDir = fs.existsSync(path.resolve(__dirname, 'Public')) ? path.resolve(__dirname, 'Public') : path.resolve(__dirname, 'public')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: publicDir,
  server: {
    port: 5173,
    host: true
  }
})
