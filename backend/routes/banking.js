// Banking routes. For now only check-balance is implemented (tutor: only option 1 works).

const express = require('express');
const { query } = require('../db');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

// GET /check-balance - protected; JWT validated by middleware; return balance from BankUser
router.get('/check-balance', verifyToken, async (req, res) => {
    try {
        const Cid = req.Cid;
        const rows = await query('SELECT Cname, balance FROM BankUser WHERE Cid = ?', [Cid]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Account not found.' });
        }
        res.json({
            success: true,
            balance: parseFloat(rows[0].balance),
            customer_name: rows[0].Cname
        });
    } catch (err) {
        console.error('Check balance error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch balance.' });
    }
});

// POST /transfer - Transfer money to another account (Protected)
router.post('/transfer', verifyToken, async (req, res) => {
    try {
        const sender_id = req.Cid;
        const { receiver_id, amount } = req.body;

        if (!receiver_id || amount == null) {
            return res.status(400).json({ success: false, message: 'Receiver ID and amount are required.' });
        }

        const transferAmount = parseFloat(amount);
        if (isNaN(transferAmount) || transferAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
        }

        if (sender_id === parseInt(receiver_id, 10)) {
            return res.status(400).json({ success: false, message: 'Cannot transfer to yourself.' });
        }

        const senderRows = await query('SELECT balance, Cname FROM BankUser WHERE Cid = ?', [sender_id]);
        if (senderRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sender account not found.' });
        }
        const senderBalance = parseFloat(senderRows[0].balance);
        if (senderBalance < transferAmount) {
            return res.status(400).json({ success: false, message: 'Insufficient balance.' });
        }

        const receiverRows = await query('SELECT Cid, Cname FROM BankUser WHERE Cid = ?', [receiver_id]);
        if (receiverRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Receiver account not found.' });
        }

        await query('UPDATE BankUser SET balance = balance - ? WHERE Cid = ?', [transferAmount, sender_id]);
        await query('UPDATE BankUser SET balance = balance + ? WHERE Cid = ?', [transferAmount, receiver_id]);

        const [updated] = await query('SELECT balance FROM BankUser WHERE Cid = ?', [sender_id]);
        res.json({
            success: true,
            message: 'Transfer successful.',
            transfer_amount: transferAmount,
            new_balance: parseFloat(updated.balance),
            receiver_name: receiverRows[0].Cname
        });
    } catch (err) {
        console.error('Transfer error:', err.message);
        res.status(500).json({ success: false, message: 'Transfer failed.' });
    }
});

module.exports = router;
