import app from './app';
import dotenv from 'dotenv';
import './config/db';
import createTables from './config/migrate';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
  // create table
  await createTables();

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
};

startServer();
