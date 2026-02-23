// Banking Routes
// Handles balance checking and money transfer operations

const express = require('express');
const { query } = require('../db');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

// GET /check-balance - Check account balance (Protected route)
router.get('/check-balance', verifyToken, async (req, res) => {
    try {
        // customer_id is attached by verifyToken middleware
        const customer_id = req.customer_id;

        // Fetch balance from customer_accounts table
        const accounts = await query(
            'SELECT balance, customer_name FROM customer_accounts WHERE customer_id = ?',
            [customer_id]
        );

        if (accounts.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Account not found' 
            });
        }

        res.json({ 
            success: true, 
            balance: parseFloat(accounts[0].balance),
            customer_name: accounts[0].customer_name
        });
    } catch (error) {
        console.error('Check balance error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error while checking balance.' 
        });
    }
});

// POST /transfer - Transfer money to another account (Protected route)
router.post('/transfer', verifyToken, async (req, res) => {
    try {
        const sender_id = req.customer_id;  // From middleware
        const { receiver_id, amount } = req.body;

        // Validate input
        if (!receiver_id || !amount) {
            return res.status(400).json({ 
                success: false, 
                message: 'Receiver ID and amount are required' 
            });
        }

        const transferAmount = parseFloat(amount);

        if (isNaN(transferAmount) || transferAmount <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Amount must be a positive number' 
            });
        }

        if (sender_id === receiver_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot transfer money to yourself' 
            });
        }

        // Get sender account
        const senderAccounts = await query(
            'SELECT balance, customer_name FROM customer_accounts WHERE customer_id = ?',
            [sender_id]
        );

        if (senderAccounts.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Sender account not found' 
            });
        }

        const senderBalance = parseFloat(senderAccounts[0].balance);

        // Check if sender has sufficient balance
        if (senderBalance < transferAmount) {
            return res.status(400).json({ 
                success: false, 
                message: 'Insufficient balance' 
            });
        }

        // Get receiver account
        const receiverAccounts = await query(
            'SELECT balance, customer_name FROM customer_accounts WHERE customer_id = ?',
            [receiver_id]
        );

        if (receiverAccounts.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Receiver account not found' 
            });
        }

        // Perform transfer transaction
        // Deduct from sender
        await query(
            'UPDATE customer_accounts SET balance = balance - ? WHERE customer_id = ?',
            [transferAmount, sender_id]
        );

        // Add to receiver
        await query(
            'UPDATE customer_accounts SET balance = balance + ? WHERE customer_id = ?',
            [transferAmount, receiver_id]
        );

        // Get updated balances
        const updatedSender = await query(
            'SELECT balance FROM customer_accounts WHERE customer_id = ?',
            [sender_id]
        );
        const updatedReceiver = await query(
            'SELECT balance, customer_name FROM customer_accounts WHERE customer_id = ?',
            [receiver_id]
        );

        res.json({ 
            success: true, 
            message: 'Transfer successful',
            transfer_amount: transferAmount,
            new_balance: parseFloat(updatedSender[0].balance),
            receiver_name: updatedReceiver[0].customer_name
        });
    } catch (error) {
        console.error('Transfer error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error during transfer.' 
        });
    }
});

module.exports = router;
