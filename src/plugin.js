import fastifyJWT from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import HttpErrors from 'http-errors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import routes from './routes.js';

const { Unauthorized } = HttpErrors;

const setUpStaticAssets = (fastify) => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../static'),
  });

  fastify.setNotFoundHandler((req, res) => {
    res.sendFile('index.html');
  });
};

const setUpAuth = (fastify) => {
  fastify
    .register(fastifyJWT, {
      secret: 'supersecret',
    })
    .decorate('authenticate', async (req, res) => {
      try {
        await req.jwtVerify();
      } catch (_err) {
        res.send(new Unauthorized());
      }
    });
};

export default async (fastify, options) => {
  setUpAuth(fastify);
  setUpStaticAssets(fastify);
  routes(fastify, options?.state || {});

  return fastify;
};
