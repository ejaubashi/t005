import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.PAGES_BASE_PATH || '/',
  plugins: [
    {
      name: 'reference-media-base',
      enforce: 'pre',
      transform(code, id) {
        if (!id.endsWith('/src/reference/runtime.js')) return null;
        // Adapt public-media URLs without changing the audited reference snapshot.
        return {
          code: code
            .replaceAll('`/pictures/', '`${import.meta.env.BASE_URL}pictures/')
            .replaceAll('`/video/', '`${import.meta.env.BASE_URL}video/'),
          map: null,
        };
      },
    },
  ],
});
