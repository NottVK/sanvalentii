import { defineConfig } from 'vite';

// El código vive en app/ y el juego ya armado se guarda en la raíz del repo,
// porque GitHub Pages publica la raíz de la rama main tal cual.
export default defineConfig({
  root: 'app',
  base: './',
  build: {
    outDir: '..',
    emptyOutDir: false,
    assetsDir: 'juego',
    chunkSizeWarningLimit: 2000,
  },
  server: { host: true },
});
