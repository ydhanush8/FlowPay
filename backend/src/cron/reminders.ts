import cron from 'node-cron';
import prisma from '../db';
import { PaymentStatus } from '@prisma/client';

// Run daily at 9:00 AM
cron.schedule('0 9 * * *', async () => {
    console.log('Running daily payment reminder check...');
    
    try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0,0,0,0);
        
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        dayAfterTomorrow.setHours(0,0,0,0);
        
        // Find payments due tomorrow
        const duePayments = await prisma.payment.findMany({
            where: {
                dueDate: {
                    gte: tomorrow,
                    lt: dayAfterTomorrow
                },
                status: PaymentStatus.PENDING
            },
            include: {
                agreement: {
                    include: {
                        payer: true
                    }
                }
            }
        });

        for (const payment of duePayments) {
            // In a real application, you would integrate Resend/SendGrid here to send emails
            console.log(`REMINDER: Payment for agreement "${payment.agreement.title}" of amount ₹${payment.amount} is due tomorrow. Email sent to: ${payment.agreement.payer?.email || payment.agreement.payerId}`);
        }

        // Also check overdue
        const overduePayments = await prisma.payment.findMany({
            where: {
                dueDate: {
                    lt: today
                },
                status: PaymentStatus.PENDING
            },
            include: {
                agreement: {
                    include: {
                        payer: true
                    }
                }
            }
        });

        for (const payment of overduePayments) {
            // Send overdue reminder
            console.log(`OVERDUE: Payment for agreement "${payment.agreement.title}" of amount ₹${payment.amount} is OVERDUE. Email sent to: ${payment.agreement.payer?.email || payment.agreement.payerId}`);
            
            // Note: you might want to also update the status to 'LATE' if it hasn't been done
            await prisma.payment.update({
                where: { id: payment.id },
                data: { status: PaymentStatus.LATE }
            });
        }
    } catch (error) {
        console.error('Error running daily cron job:', error);
    }
});

console.log('Cron jobs initialized');
