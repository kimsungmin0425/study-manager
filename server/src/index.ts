import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDB } from './db';
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import sleepRoutes from './routes/sleep';
import todoRoutes from './routes/todos';
import groupRoutes from './routes/groups';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/groups', groupRoutes);

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../../client/dist/index.html')));
}

app.get('/health', (_, res) => res.json({ status: 'ok' }));

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
