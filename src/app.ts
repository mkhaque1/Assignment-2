import express, { type Application } from 'express';
import authRoutes from './modules/auth/auth.routes';
import issuesRoutes from './modules/issues/issues.routes';

const app: Application = express();

app.use(express.json());

// Health check — useful to test if server is running
app.get('/', (_req, res) => {
  res.json({ message: 'DevPulse API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);

export default app;
