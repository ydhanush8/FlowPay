import { Router } from 'express';
import express from 'express';
import { Webhook } from 'svix';
import crypto from 'crypto';
import prisma from '../db';
import { Plan, PaymentStatus } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

// Middleware to capture the raw body for signature verification
router.use(express.raw({ type: 'application/json' }));

// 1. Clerk Webhooks (User Sync)
router.post('/clerk', async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env' });
  }

  // Get headers
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Error occured -- no svix headers' });
  }

  const payload = req.body;
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Verify signature
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return res.status(400).json({ error: 'Error verifying webhook' });
  }

  // Handle events
  const eventType = evt.type;
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim();

    await prisma.user.upsert({
      where: { id },
      update: { email, name },
      create: { id, email, name },
    });
  } else if (eventType === 'user.deleted') {
    const { id } = evt.data;
    await prisma.user.delete({ where: { id } });
  }

  res.status(200).json({ success: true });
});

// 2. Razorpay Webhooks (Payment & Subscription Sync)
router.post('/razorpay', async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '';
  const cryptoSignature = req.headers['x-razorpay-signature'] as string;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(req.body.toString())
    .digest('hex');

  if (expectedSignature !== cryptoSignature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(req.body.toString());

  try {
    // Handle Subscription events for monetization
    if (event.event === 'subscription.authenticated' || event.event === 'subscription.activated') {
      const subId = event.payload.subscription.entity.id;
      const userId = event.payload.subscription.entity.notes.userId;
      const status = event.payload.subscription.entity.status;

      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: Plan.PRO,
            subscriptionStatus: status,
            razorpaySubscriptionId: subId
          }
        });
        console.log(`User ${userId} upgraded to PRO via subscription ${subId}`);
      }
    }
    
    // Handle legacy order logic if still needed, or remove
    if (event.event === 'order.paid') {
      const orderId = event.payload.payment.entity.order_id;
      const transactionId = event.payload.payment.entity.id;

      const payment = await prisma.payment.findFirst({
        where: { transactionRef: orderId } // We repurposed transactionRef
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            transactionRef: transactionId,
            paidAt: new Date()
          }
        });
      }
    }
  } catch (err) {
    console.error('Failed to process Razorpay webhook', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  res.status(200).json({ success: true });
});

export default router;
