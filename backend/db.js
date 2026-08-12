// Database layer for KODBANK.
//
// Two backends behind one interface:
// - MySQL via mysql2 (production / Aiven) — set DB_HOST, DB_PORT, DB_USER,
//   DB_PASSWORD, DB_NAME, optional DB_SSL=true.
// - A JSON file store (backend/data/db.json) used automatically when MySQL
//   is unreachable, so the app runs with zero external setup in local dev.
//
// Callers use two primitives:
//   query(sql, params)        — single statement, auto-committed.
//   transaction(async (tx) => { await tx.query(...); ... })
//                              — all statements inside `work` succeed together
//                                or none of them are persisted (used by the
//                                money-transfer flow so a crash mid-transfer
//                                can never debit one account without
//                                crediting the other).

const fs = require('fs/promises');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bank_user',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(dbConfig);
let mode = (process.env.DB_MODE || 'mysql').toLowerCase(); // 'mysql' | 'file'

// ---------------------------------------------------------------------------
// File-DB fallback
// ---------------------------------------------------------------------------

const fileDbPath = path.join(__dirname, 'data', 'db.json');
const SEED_PATH = path.join(__dirname, 'data', 'seed.json');

async function emptyDb() {
    return {
        meta: { nextCid: 1, nextTokenId: 1, nextTxnId: 1 },
        BankUser: [],
        BankUserJwt: [],
        BankTransferLog: []
    };
}

async function ensureFileDb() {
    const dir = path.dirname(fileDbPath);
    await fs.mkdir(dir, { recursive: true });
    try {
        await fs.access(fileDbPath);
    } catch {
        // No local DB yet: start from the committed seed if present, else empty.
        let initial;
        try {
            initial = JSON.parse(await fs.readFile(SEED_PATH, 'utf8'));
        } catch {
            initial = await emptyDb();
        }
        await fs.writeFile(fileDbPath, JSON.stringify(initial, null, 2), 'utf8');
    }
}

async function readFileDb() {
    await ensureFileDb();
    const raw = await fs.readFile(fileDbPath, 'utf8');
    const db = JSON.parse(raw || '{}');
    db.meta = db.meta || { nextCid: 1, nextTokenId: 1, nextTxnId: 1 };
    if (!Array.isArray(db.BankUser)) db.BankUser = [];
    if (!Array.isArray(db.BankUserJwt)) db.BankUserJwt = [];
    if (!Array.isArray(db.BankTransferLog)) db.BankTransferLog = [];
    return db;
}

async function writeFileDb(db) {
    await fs.writeFile(fileDbPath, JSON.stringify(db, null, 2), 'utf8');
}

function normalize(sql) {
    return sql.trim().replace(/\s+/g, ' ').replace(/\s+for update$/i, '').toLowerCase();
}

// Runs one statement against an in-memory `db` object. No I/O here — the
// caller (fileQuery or a transaction) decides when/whether to persist, which
// is what makes `transaction()` all-or-nothing in file mode too.
function fileExec(db, sql, params = []) {
    const q = normalize(sql);

    // Note the trailing "(" — "bankuser" is a literal prefix of "bankuserjwt",
    // so a bare startsWith('insert into bankuser') here would also swallow
    // BankUserJwt inserts and silently corrupt the BankUser table (this was
    // the root cause of the original app's corrupted legacy rows).
    if (q.startsWith('insert into bankuser (')) {
        const [Cname, Cpwd, email] = params;
        const emailNorm = String(email || '').trim().toLowerCase();
        if (db.BankUser.some(u => String(u.email).toLowerCase() === emailNorm)) {
            const err = new Error('Duplicate entry');
            err.code = 'ER_DUP_ENTRY';
            throw err;
        }
        const Cid = db.meta.nextCid++;
        db.BankUser.push({
            Cid,
            Cname: String(Cname || '').trim(),
            Cpwd: String(Cpwd || ''),
            balance: 500000,
            email: String(email || '').trim(),
            created_at: new Date().toISOString()
        });
        return { affectedRows: 1, insertId: Cid };
    }

    if (q.includes('from bankuser where email = ?')) {
        const [email] = params;
        const emailNorm = String(email || '').trim().toLowerCase();
        return db.BankUser.filter(u => String(u.email).toLowerCase() === emailNorm);
    }

    if (q.includes('from bankuser where cid = ?') && !q.includes('update')) {
        const [Cid] = params;
        return db.BankUser.filter(u => u.Cid === Number(Cid));
    }

    if (q.includes('from bankuser where cid <> ? order by cid')) {
        const [Cid] = params;
        return db.BankUser
            .filter(u => u.Cid !== Number(Cid))
            .sort((a, b) => a.Cid - b.Cid);
    }

    if (q.startsWith('update bankuser set balance = balance - ? where cid = ?')) {
        const [amount, Cid] = params;
        const u = db.BankUser.find(x => x.Cid === Number(Cid));
        if (u) u.balance = Number(u.balance) - Number(amount);
        return { affectedRows: u ? 1 : 0 };
    }

    if (q.startsWith('update bankuser set balance = balance + ? where cid = ?')) {
        const [amount, Cid] = params;
        const u = db.BankUser.find(x => x.Cid === Number(Cid));
        if (u) u.balance = Number(u.balance) + Number(amount);
        return { affectedRows: u ? 1 : 0 };
    }

    if (q.startsWith('insert into banktransferlog')) {
        const [senderCid, receiverCid, senderLabel, receiverLabel, amount, reference, createdAt] = params;
        const id = db.meta.nextTxnId++;
        db.BankTransferLog.push({
            id,
            sender_cid: Number(senderCid),
            receiver_cid: Number(receiverCid),
            sender_label: String(senderLabel || ''),
            receiver_label: String(receiverLabel || ''),
            amount: Number(amount),
            type: 'transfer',
            reference: reference ? String(reference) : null,
            status: 'completed',
            created_at: new Date(createdAt).toISOString()
        });
        return { affectedRows: 1, insertId: id };
    }

    if (q.includes('from banktransferlog where sender_cid = ? or receiver_cid = ?')) {
        const [senderCid, receiverCid, limit] = params;
        const lim = Number(limit || 20);
        return db.BankTransferLog
            .filter(t => t.sender_cid === Number(senderCid) || t.receiver_cid === Number(receiverCid))
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, lim);
    }

    if (q.startsWith('insert into bankuserjwt')) {
        const [tokenvalue, Cid, exp] = params;
        const tokenid = db.meta.nextTokenId++;
        db.BankUserJwt.push({
            tokenid,
            tokenvalue: String(tokenvalue),
            Cid: Number(Cid),
            exp: new Date(exp).toISOString(),
            created_at: new Date().toISOString()
        });
        return { affectedRows: 1, insertId: tokenid };
    }

    if (q.includes('from bankuserjwt where tokenvalue = ? and cid = ?')) {
        const [tokenvalue, Cid] = params;
        return db.BankUserJwt.filter(t => t.tokenvalue === String(tokenvalue) && t.Cid === Number(Cid));
    }

    if (q.startsWith('delete from bankuserjwt where tokenvalue = ? and cid = ?')) {
        const [tokenvalue, Cid] = params;
        const before = db.BankUserJwt.length;
        db.BankUserJwt = db.BankUserJwt.filter(t => !(t.tokenvalue === String(tokenvalue) && t.Cid === Number(Cid)));
        return { affectedRows: before - db.BankUserJwt.length };
    }

    if (q.startsWith('delete from bankuserjwt where tokenid = ?')) {
        const [tokenid] = params;
        const before = db.BankUserJwt.length;
        db.BankUserJwt = db.BankUserJwt.filter(t => t.tokenid !== Number(tokenid));
        return { affectedRows: before - db.BankUserJwt.length };
    }

    const err = new Error(`File DB does not support query: ${sql}`);
    err.code = 'FILE_DB_UNSUPPORTED_QUERY';
    throw err;
}

async function fileQuery(sql, params) {
    const db = await readFileDb();
    const result = fileExec(db, sql, params);
    // Anything that isn't a pure SELECT mutates `db`; persist unconditionally
    // for single-statement calls (multi-statement atomicity is handled by
    // fileTransaction below, which persists once at the end instead).
    await writeFileDb(db);
    return result;
}

async function fileTransaction(work) {
    const db = await readFileDb();
    const tx = { query: async (sql, params) => fileExec(db, sql, params) };
    const result = await work(tx); // throwing here means nothing gets persisted
    await writeFileDb(db);
    return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

async function testConnection() {
    if (mode === 'file') {
        await ensureFileDb();
        console.log('File DB enabled (no MySQL required)');
        return true;
    }
    try {
        const conn = await pool.getConnection();
        console.log('Database connected (MySQL)');
        conn.release();
        return true;
    } catch (err) {
        console.error('Database connection failed:', err.message);
        mode = 'file';
        await ensureFileDb();
        console.log('Falling back to local file DB (dev mode) — set DB_* env vars for MySQL/Aiven.');
        return true;
    }
}

async function query(sql, params = []) {
    if (mode === 'file') {
        return await fileQuery(sql, params);
    }
    const [rows] = await pool.execute(sql, params);
    return rows;
}

async function transaction(work) {
    if (mode === 'file') {
        return await fileTransaction(work);
    }
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const tx = {
            query: async (sql, params) => {
                const [rows] = await conn.execute(sql, params);
                return rows;
            }
        };
        const result = await work(tx);
        await conn.commit();
        return result;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

function getMode() {
    return mode;
}

module.exports = { pool, testConnection, query, transaction, getMode };
