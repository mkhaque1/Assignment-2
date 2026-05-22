import express, { Application, Request, Response, NextFunction } from 'express';
import authRoutes from './modules/auth/auth.routes';
import issuesRoutes from './modules/issues/issues.routes';
import { sendError } from './utils/response';
import { StatusCodes } from 'http-status-codes';

const app: Application = express();

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'DevPulse API is running 🚀' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);

// 404 handler — when no route matches
app.use((_req, res) => {
  sendError(res, StatusCodes.NOT_FOUND, 'Route not found.');
});

// Global error handler — must have 4 params for Express to treat it as error middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.message);
  sendError(
    res,
    StatusCodes.INTERNAL_SERVER_ERROR,
    'Something went wrong.',
    err.message,
  );
});

export default app;
