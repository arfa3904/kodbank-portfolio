/**
 * Run database.sql on Aiven MySQL.
 * Uses backend/.env for connection. Run from project root: node scripts/run-schema.js
 */
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    connectTimeout: 10000, // 10 second timeout
};

// Aiven MySQL requires SSL - use rejectUnauthorized: false for testing
if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = { rejectUnauthorized: false };
}

async function run() {
    const sqlPath = path.join(__dirname, '../database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Connecting to Aiven MySQL...');
    console.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`User: ${dbConfig.user}`);
    console.log(`SSL: ${dbConfig.ssl ? 'enabled' : 'disabled'}`);
    
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL server');
        
        await conn.query(sql);
        console.log('✅ Database "bank_user" and tables BankUser, BankUserJwt created (sample data inserted).');
    } catch (err) {
        console.error('\n❌ Schema run failed:', err.message);
        console.error(`Error code: ${err.code}`);
        if (err.code === 'ENOTFOUND') {
            console.error('\n💡 Troubleshooting:');
            console.error('1. Check if the Aiven MySQL service is running (not paused)');
            console.error('2. Verify DB_HOST in backend/.env matches Aiven console');
            console.error('3. Check your internet connection');
            console.error('4. Try pinging the hostname to verify DNS resolution');
        } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
            console.error('\n💡 Troubleshooting:');
            console.error('1. Verify DB_PORT (20185) is correct in Aiven console');
            console.error('2. Check if your IP is whitelisted in Aiven firewall settings');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Troubleshooting:');
            console.error('1. Verify DB_USER and DB_PASSWORD in backend/.env');
            console.error('2. Check credentials in Aiven console');
        }
        process.exit(1);
    } finally {
        if (conn) {
            await conn.end();
        }
    }
}

run();
