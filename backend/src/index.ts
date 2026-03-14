import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import agreementsRouter from './routes/agreements';
import paymentsRouter from './routes/payments';
import invitationsRouter from './routes/invitations';
import webhooksRouter from './routes/webhooks';
import './cron/reminders'; // Initialize cron jobs

const app = express();
const port = process.env.PORT || 5000;

// Middleware
// Webhooks need raw body for signature verification, so we mount them before `express.json()`
app.use('/api/webhooks', webhooksRouter);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/agreements', agreementsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/invitations', invitationsRouter);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
