import { defineConfig } from 'vite-plus';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: true,
    lib: {
      entry: 'src/content-script.js',
      formats: ['iife'],
      name: 'forceScrollbar',
      fileName: () => 'force-scrollbar.js',
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
  },
});
