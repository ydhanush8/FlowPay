import { Router } from 'express';
import { PaymentStatus, InvitationStatus, AgreementStatus, Plan } from '@prisma/client';
import prisma from '../db';
import { add } from 'date-fns';
import { sendInvitationEmail } from '../utils/emailService';

const router = Router();

// Create invitation
router.post('/', async (req, res) => {
  try {
    const { agreementId, senderId, receiverEmail } = req.body;
    
    // Check if agreeement exists
    const agreement = await prisma.agreement.findUnique({ where: { id: agreementId } });
    if (!agreement) return res.status(404).json({ error: 'Agreement not found' });

    const invitation = await prisma.invitation.create({
      data: {
        agreementId,
        senderId,
        receiverEmail,
      },
      include: {
        agreement: true,
        sender: true
      }
    });
    
    // Send real email
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const invitationLink = `${frontendUrl}/invitations/${invitation.token}`;
      await sendInvitationEmail(
        receiverEmail, 
        invitation.sender.name || invitation.sender.email,
        invitation.agreement.title,
        invitationLink
      );
      console.log(`[Success] Invitation email sent to ${receiverEmail}`);
    } catch (mailError) {
      console.error("[Error] Failed to send invitation email:", mailError);
    }
    
    console.log(`[Success] Invitation created for agreement ${agreementId}`);
    res.status(201).json(invitation);
  } catch (error) {
    console.error("[Error] Invitation creation failed:", error);
    res.status(500).json({ 
      error: 'Failed to create invitation',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get invitation details by token
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        agreement: true,
        sender: true
      }
    });

    if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
    
    res.json(invitation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to find invitation' });
  }
});

// Accept invitation
router.post('/:token/accept', async (req, res) => {
  try {
    const { token } = req.params;
    const { receiverId } = req.body; // Authenticated user ID

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { agreement: true }
    });

    if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
    if (invitation.status !== 'PENDING') return res.status(400).json({ error: 'Invitation is not pending' });

    // Lazy Sync for Receiver
    let user = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!user) {
      console.log(`[LazySync] Creating record for receiver ${receiverId}`);
      await prisma.user.create({
        data: {
          id: receiverId,
          email: req.body.receiverEmail || `${receiverId}@temp.user`,
          name: req.body.receiverName || 'Receiver',
          plan: Plan.FREE
        }
      });
    }

    // Update invitation, agreement and generate payments securely within a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Mark invitation accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED }
      });

      // 2. Update agreement status and set receiver
      const updatedAgreement = await tx.agreement.update({
        where: { id: invitation.agreementId },
        data: {
            status: AgreementStatus.ACTIVE,
            receiverId: receiverId
        }
      });

      // 3. Generate Payment schedule
      // MVP logic: just generate first 12 payments if end date is not available or it's a long period
      const paymentsToCreate = [];
      let currentDate = new Date(updatedAgreement.startDate);
      const limit = 12; // cap purely for safety in MVP

      for (let i = 0; i < limit; i++) {
        paymentsToCreate.push({
            agreementId: updatedAgreement.id,
            amount: updatedAgreement.amount,
            dueDate: currentDate,
            status: PaymentStatus.PENDING
        });

        if (updatedAgreement.endDate && currentDate >= new Date(updatedAgreement.endDate)) {
            break;
        }

        // Add duration based on frequency
        if (updatedAgreement.frequency === 'MONTHLY') {
            currentDate = add(currentDate, { months: 1 });
        } else if (updatedAgreement.frequency === 'WEEKLY') {
            currentDate = add(currentDate, { weeks: 1 });
        } else if (updatedAgreement.frequency === 'QUARTERLY') {
            currentDate = add(currentDate, { months: 3 });
        } else if (updatedAgreement.frequency === 'YEARLY') {
            currentDate = add(currentDate, { years: 1 });
        } else {
            // custom, just default to monthly fallback for MVP
            currentDate = add(currentDate, { months: 1 });
        }
        
      }

      await tx.payment.createMany({
        data: paymentsToCreate
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

export default router;
