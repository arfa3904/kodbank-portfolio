// Banking routes: all protected by verifyToken. Balance/receivers/transactions
// are always scoped to req.Cid (from the verified JWT) — the client can never
// supply a customer ID for these and have it be trusted.

const express = require('express');
const bankingService = require('../services/bankingService');
const verifyToken = require('../middleware/verifyToken');
const { asyncHandler } = require('../middleware/errorHandler');
const router = express.Router();

router.use(verifyToken);

router.get('/balance', asyncHandler(async (req, res) => {
    const { balance, customerName } = await bankingService.getBalance(req.Cid);
    res.json({ success: true, balance, customer_name: customerName });
}));

router.get('/receivers', asyncHandler(async (req, res) => {
    const receivers = await bankingService.listReceivers(req.Cid);
    res.json({
        success: true,
        receivers: receivers.map(r => ({
            Cid: r.Cid,
            Cname: r.Cname,
            email: r.email,
            email_hint: r.emailHint
        }))
    });
}));

router.post('/transfer', asyncHandler(async (req, res) => {
    const { receiver_id, receiver_email, amount, reference } = req.body;
    const result = await bankingService.transferFunds({
        senderCid: req.Cid,
        receiverId: receiver_id,
        receiverEmail: receiver_email,
        amount,
        reference
    });
    res.json({
        success: true,
        message: 'Transfer successful.',
        transfer_amount: result.transferAmount,
        new_balance: result.newBalance,
        receiver_name: result.receiverName,
        receiver_id: result.receiverId
    });
}));

router.get('/transactions', asyncHandler(async (req, res) => {
    const transactions = await bankingService.listTransactions(req.Cid);
    res.json({
        success: true,
        transactions: transactions.map(t => ({
            type: t.type,
            amount: t.amount,
            counterparty: t.counterparty,
            reference: t.reference,
            status: t.status,
            created_at: t.createdAt
        }))
    });
}));

module.exports = router;
