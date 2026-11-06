import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { mediaFolders } from './media-folders.js'

export default defineConfig({
  plugins: [react(), mediaFolders(), tailwindcss()],
})