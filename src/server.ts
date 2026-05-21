import { createServer, IncomingMessage } from 'node:http';
import express from 'express';

import type { Request, Response } from 'express';

const app = express();

const server = createServer((req: IncomingMessage, res) => {
  app(req, res);
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World');
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
