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
        main:     resolve(__dirname, 'index.html'),
        games:    resolve(__dirname, 'games/index.html'),
        gallery:  resolve(__dirname, 'gallery/index.html'),
        videos:   resolve(__dirname, 'videos/index.html'),
        story:    resolve(__dirname, 'story/index.html'),
        puzzle:   resolve(__dirname, 'puzzle/index.html'),
        carousel: resolve(__dirname, 'carousel/index.html'),
      },
    },
  },
  server: { port: 3000, open: true },
});
