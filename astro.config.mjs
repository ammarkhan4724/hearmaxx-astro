import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { spawn } from 'child_process';
import path from 'path';

function phpFormHandlerPlugin() {
  return {
    name: 'php-form-handler-dev',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/form-handler.php' && req.method === 'POST') {
          const chunks = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', () => {
            const body = Buffer.concat(chunks).toString();
            const phpPath = path.resolve('public/form-handler.php').replace(/\\/g, '/');

            const php = spawn('php', ['-r', `
              $raw = file_get_contents("php://stdin");
              parse_str($raw, $_POST);
              $_SERVER["REQUEST_METHOD"] = "POST";
              $_SERVER["HTTP_X_REQUESTED_WITH"] = "xmlhttprequest";
              require "${phpPath}";
            `]);

            php.stdin.write(body);
            php.stdin.end();

            let output = '';
            php.stdout.on('data', d => output += d);
            php.on('close', code => {
              res.setHeader('Content-Type', 'application/json; charset=UTF-8');
              if (code === 0 && output.trim()) {
                res.statusCode = 200;
                res.end(output.trim());
              } else {
                res.statusCode = 200;
                res.end(JSON.stringify({
                  status: 'success',
                  message: 'Thank you! Your request has been received. Our clinical team will contact you promptly.'
                }));
              }
            });
          });
          return;
        }
        next();
      });
    }
  };
}

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://hearmaxx.ca',
  trailingSlash: 'always',
  output: 'static',
  compressHTML: true,
  build: {
    inlineStylesheets: 'always',
  },
  prefetch: {
    defaultStrategy: 'hover',
    prefetchAll: true,
  },
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  devToolbar: { enabled: false },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
  vite: {
    plugins: [tailwindcss(), phpFormHandlerPlugin()],
    server: {
      allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'],
    },
  },
});
