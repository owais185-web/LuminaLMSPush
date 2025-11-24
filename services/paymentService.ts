
import { db } from './db';
import { Transaction } from '../types';

export const paymentService = {
    /**
     * Simulates a Stripe Payment Intent process
     */
    processPayment: async (userId: string, amount: number, description: string): Promise<{success: boolean, transaction?: Transaction, error?: string}> => {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate 10% random decline rate
        if (Math.random() > 0.95) {
             return { success: false, error: 'Card declined by bank. Please try another method.' };
        }

        const user = db.users.findById(userId);
        const transaction: Transaction = {
            id: `txn_${Date.now()}`,
            userId,
            userName: user?.name || 'Unknown',
            description,
            amount,
            status: 'succeeded',
            date: new Date(),
            invoiceId: `INV-${Date.now().toString().slice(-6)}`,
            paymentMethod: `Visa ${user?.billing?.savedCardLast4 || '4242'}`
        };

        db.transactions.add(transaction);
        return { success: true, transaction };
    },

    validateCoupon: async (code: string) => {
        await new Promise(resolve => setTimeout(resolve, 500)); // Latency
        return db.coupons.find(code);
    },

    /**
     * Generates a mock PDF blob for invoice download
     */
    generateInvoicePDF: (transaction: Transaction) => {
        const content = `
        LUMINA LMS - INVOICE
        --------------------
        Invoice ID: ${transaction.invoiceId}
        Date: ${new Date(transaction.date).toLocaleDateString()}
        
        Billed To: ${transaction.userName}
        Item: ${transaction.description}
        Payment Method: ${transaction.paymentMethod}
        
        --------------------
        TOTAL: $${transaction.amount.toFixed(2)}
        Status: ${transaction.status.toUpperCase()}
        --------------------
        
        Thank you for learning with Lumina!
        `;
        
        const blob = new Blob([content], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
    }
};
