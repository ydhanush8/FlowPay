import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../db';
import { Plan, PaymentStatus } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Manual payment confirmation (Payer or Receiver marks as PAID)
router.patch('/confirm/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const transactionRef = body.transactionRef;
    
    console.log(`[Request] Confirming payment ID: ${id}`);

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        transactionRef: transactionRef || null
      }
    });

    console.log(`[Success] Payment ${id} confirmed as PAID`);
    res.json(payment);
  } catch (error) {
    console.error('[Error] Payment confirmation failed:', error);
    res.status(500).json({ 
      error: 'Failed to confirm payment',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Create Razorpay Subscription (for Pro Upgrade)
router.post('/create-subscription', async (req, res) => {
  try {
    const { userId, planType } = req.body; // planType: 'MONTHLY' | 'YEARLY'
    
    // In a real app, these Plan IDs would come from Razorpay Dashboard
    // For this implementation, we'll use placehoders or create on the fly if needed
    // Assuming you have plans created in Razorpay:
    const planId = planType === 'YEARLY' 
      ? process.env.RAZORPAY_PLAN_YEARLY 
      : process.env.RAZORPAY_PLAN_MONTHLY;

    if (!planId) {
      return res.status(400).json({ error: 'Subscription Plan IDs not configured in .env' });
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: planType === 'YEARLY' ? 10 : 120, // Duration
      quantity: 1,
      customer_notify: 1,
      notes: { userId }
    });

    // We don't update the user plan yet; we wait for the 'subscription.authenticated' or 'payment.captured' webhook
    res.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Failed to initialize subscription upgrade' });
  }
});

// Get user info (including plan)
router.get('/user-plan/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, subscriptionStatus: true }
    });

    if (!user) {
      // Lazy Sync: Return a default FREE plan so dashboard doesn't crash
      return res.json({ plan: Plan.FREE, subscriptionStatus: null });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user plan' });
  }
});

// Get user payments (Existing)
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const payments = await prisma.payment.findMany({
            where: {
                agreement: {
                    OR: [
                        { payerId: userId },
                        { receiverId: userId }
                    ]
                }
            },
            include: {
                agreement: true
            },
            orderBy: {
                dueDate: 'asc'
            }
        });
        res.json(payments);
    } catch(err) {
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

export default router;
