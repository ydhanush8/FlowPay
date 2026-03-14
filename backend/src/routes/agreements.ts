import { Router } from 'express';
import { Plan } from '@prisma/client';
import prisma from '../db';

const router = Router();

// Create agreement
router.post('/', async (req, res) => {
  try {
    const { title, description, amount, frequency, startDate, endDate, rules, payerId, receiverId, paymentLink } = req.body;

    // 1. Lazy Sync: Ensure user exists in our DB (Auto-create if missing)
    // This is a workaround for local development where Clerk webhooks cannot reach localhost.
    let user = await prisma.user.findUnique({
      where: { id: payerId },
      include: { sentAgreements: true }
    });

    if (!user) {
      console.log(`[LazySync] Creating record for user ID: ${payerId}`);
      user = await prisma.user.create({
        data: {
          id: payerId,
          email: req.body.payerEmail || `${payerId}@temp.user`, // Fallback if not provided
          name: req.body.payerName || 'User',
          plan: Plan.FREE
        },
        include: { sentAgreements: true }
      });
    }

    // 2. Check plan limits
    if (user.plan === Plan.FREE && user.sentAgreements.length >= 2) {
      return res.status(403).json({ 
        error: 'Free plan limit reached (2 agreements). Please upgrade to PRO for unlimited agreements.',
        code: 'LIMIT_REACHED'
      });
    }

    const agreement = await prisma.agreement.create({
      data: {
        title,
        description,
        amount,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        rules,
        payerId,
        receiverId,
        paymentLink, // Store the external redirect URL
      }
    });
    res.status(201).json(agreement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create agreement' });
  }
});

// Get agreements for user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const agreements = await prisma.agreement.findMany({
      where: {
        OR: [
          { payerId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        payer: true,
        receiver: true
      }
    });
    res.json(agreements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agreements' });
  }
});

// Get agreement by ID
router.get('/:id', async (req, res) => {
    try {
      const agreement = await prisma.agreement.findUnique({
        where: { id: req.params.id },
        include: {
          payments: {
            orderBy: { dueDate: 'asc' }
          },
          payer: true,
          receiver: true
        }
      });
      if (!agreement) {
        return res.status(404).json({ error: 'Agreement not found' });
      }
      res.json(agreement);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch agreement' });
    }
  });

export default router;
