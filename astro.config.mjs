import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://pink-kingfisher-948450.hostingersite.com',
  devToolbar: { enabled: false },
  vite: {
    server: {
      // Allow the sandboxed live-preview hosts (e.g. *.e2b.app) to reach the dev server.
      allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'],
    },
  },
});
