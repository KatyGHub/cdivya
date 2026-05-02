import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main:    resolve(__dirname, 'index.html'),
        games:   resolve(__dirname, 'games.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        videos:  resolve(__dirname, 'videos.html'),
        story:   resolve(__dirname, 'story.html'),
        puzzle:  resolve(__dirname, 'puzzle.html'),
      },
    },
  },
  server: { port: 3000, open: true },
});
