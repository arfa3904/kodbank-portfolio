// Database connection for KODBANK backend
// Configure for Aiven MySQL: set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in .env

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

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

// Aiven (and many cloud DBs) use SSL - use rejectUnauthorized: false for Aiven
if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(dbConfig);

async function testConnection() {
    try {
        const conn = await pool.getConnection();
        console.log('✅ Database connected (Aiven/MySQL)');
        conn.release();
        return true;
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        return false;
    }
}

async function query(sql, params) {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (err) {
        console.error('DB query error:', err.message);
        throw err;
    }
}

module.exports = { pool, testConnection, query };
