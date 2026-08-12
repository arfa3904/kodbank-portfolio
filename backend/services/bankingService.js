const { query, transaction } = require('../db');
const AppError = require('../utils/AppError');
const { isPositiveAmount } = require('../utils/validators');

function maskEmail(email) {
    const e = String(email || '').trim();
    if (!e.includes('@')) return '';
    const [name, domain] = e.split('@');
    return name.length <= 2 ? `${name[0]}*@${domain}` : `${name.slice(0, 2)}***@${domain}`;
}

async function getBalance(Cid) {
    const rows = await query('SELECT Cname, balance FROM BankUser WHERE Cid = ?', [Cid]);
    if (rows.length === 0) {
        throw new AppError(404, 'Account not found.');
    }
    return { balance: parseFloat(rows[0].balance), customerName: rows[0].Cname };
}

async function listReceivers(Cid) {
    const rows = await query('SELECT Cid, Cname, email FROM BankUser WHERE Cid <> ? ORDER BY Cid', [Cid]);
    return rows.map(r => ({
        Cid: Number(r.Cid),
        Cname: r.Cname,
        email: r.email,
        emailHint: maskEmail(r.email)
    }));
}

// Resolves whatever the client sent (a numeric account ID, or an email) to a
// concrete BankUser row, looking it up with the given `tx` so the read
// participates in the same transaction as the balance update that follows.
async function resolveReceiver(tx, { receiverId, receiverEmail }) {
    const idRaw = receiverId == null ? '' : String(receiverId).trim();
    const emailRaw = receiverEmail ? String(receiverEmail).trim() : '';
    const isNumericId = /^[0-9]+$/.test(idRaw);

    const rows = isNumericId
        ? await tx.query('SELECT Cid, Cname, email FROM BankUser WHERE Cid = ? FOR UPDATE', [parseInt(idRaw, 10)])
        : await tx.query('SELECT Cid, Cname, email FROM BankUser WHERE email = ? FOR UPDATE', [emailRaw || idRaw]);

    return rows[0] || null;
}

async function transferFunds({ senderCid, receiverId, receiverEmail, amount, reference }) {
    if ((receiverId == null || receiverId === '') && !receiverEmail) {
        throw new AppError(400, 'Receiver (account ID or email) is required.');
    }
    if (!isPositiveAmount(amount)) {
        throw new AppError(400, 'Amount must be a positive number.');
    }
    const transferAmount = Math.round(parseFloat(amount) * 100) / 100;

    return transaction(async (tx) => {
        // Lock sender and receiver rows (FOR UPDATE) before reading balances so
        // two concurrent transfers touching the same account can't both read a
        // stale balance and overdraw it.
        const senderRows = await tx.query('SELECT Cid, Cname, balance FROM BankUser WHERE Cid = ? FOR UPDATE', [senderCid]);
        if (senderRows.length === 0) {
            throw new AppError(404, 'Sender account not found.');
        }
        const sender = senderRows[0];

        const receiver = await resolveReceiver(tx, { receiverId, receiverEmail });
        if (!receiver) {
            throw new AppError(404, 'Receiver account not found. Enter a valid account ID or email.');
        }
        if (Number(receiver.Cid) === Number(senderCid)) {
            throw new AppError(400, 'Cannot transfer to yourself.');
        }

        const senderBalance = parseFloat(sender.balance);
        if (senderBalance < transferAmount) {
            throw new AppError(400, 'Insufficient balance.');
        }

        await tx.query('UPDATE BankUser SET balance = balance - ? WHERE Cid = ?', [transferAmount, senderCid]);
        await tx.query('UPDATE BankUser SET balance = balance + ? WHERE Cid = ?', [transferAmount, receiver.Cid]);
        await tx.query(
            'INSERT INTO BankTransferLog (sender_cid, receiver_cid, sender_label, receiver_label, amount, reference, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [senderCid, receiver.Cid, sender.Cname, receiver.Cname, transferAmount, reference || null, new Date().toISOString()]
        );

        const updated = await tx.query('SELECT balance FROM BankUser WHERE Cid = ?', [senderCid]);

        return {
            transferAmount,
            newBalance: parseFloat(updated[0].balance),
            receiverName: receiver.Cname,
            receiverId: Number(receiver.Cid)
        };
    });
}

async function listTransactions(Cid) {
    const rows = await query(
        'SELECT sender_cid, receiver_cid, sender_label, receiver_label, amount, reference, status, created_at FROM BankTransferLog WHERE sender_cid = ? OR receiver_cid = ? ORDER BY created_at DESC LIMIT ?',
        [Cid, Cid, 20]
    );
    return rows.map(row => {
        const isDebit = Number(row.sender_cid) === Number(Cid);
        return {
            type: isDebit ? 'debit' : 'credit',
            amount: Number(row.amount),
            counterparty: isDebit ? row.receiver_label : row.sender_label,
            reference: row.reference || null,
            status: row.status || 'completed',
            createdAt: row.created_at
        };
    });
}

module.exports = { getBalance, listReceivers, transferFunds, listTransactions };
