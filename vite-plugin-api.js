import handler from './api/send-inquiry.js';

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      if (!raw) return resolve(null);
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function wrapRes(res) {
  let statusCode = 200;
  const wrapped = {
    setHeader(name, value) {
      res.setHeader(name, value);
      return wrapped;
    },
    status(code) {
      statusCode = code;
      res.statusCode = code;
      return wrapped;
    },
    end(data) {
      if (data !== undefined) res.end(data);
      else res.end();
    },
    json(body) {
      res.statusCode = statusCode;
      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json');
      }
      res.end(JSON.stringify(body));
    },
  };
  return wrapped;
}

export function vitePluginApi() {
  return {
    name: 'vite-plugin-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0];
        if (path !== '/api/send-inquiry') return next();

        try {
          if (req.method === 'POST') {
            req.body = await readJsonBody(req);
          }
          await handler(req, wrapRes(res));
        } catch (err) {
          console.error('[api/send-inquiry]', err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        }
      });
    },
  };
}
