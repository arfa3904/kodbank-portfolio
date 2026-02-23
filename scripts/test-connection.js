/**
 * Test Aiven MySQL connection - helps diagnose connection issues
 */
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    connectTimeout: 10000,
};

if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = { rejectUnauthorized: false };
}

async function test() {
    console.log('Testing Aiven MySQL connection...\n');
    console.log(`Host: ${dbConfig.host}`);
    console.log(`Port: ${dbConfig.port}`);
    console.log(`User: ${dbConfig.user}`);
    console.log(`SSL: ${dbConfig.ssl ? 'enabled' : 'disabled'}\n`);

    try {
        const conn = await mysql.createConnection(dbConfig);
        console.log('✅ Connection successful!');
        const [rows] = await conn.query('SELECT VERSION() as version');
        console.log(`MySQL Version: ${rows[0].version}`);
        await conn.end();
        return true;
    } catch (err) {
        console.error(`❌ Connection failed: ${err.message}`);
        console.error(`Error code: ${err.code}\n`);
        
        if (err.code === 'ENOTFOUND') {
            console.log('💡 DNS resolution failed (hostname not found).');
            console.log('');
            console.log('   Most likely: Your Aiven MySQL service is POWERED OFF.');
            console.log('   → Open Aiven Console → your MySQL service (mysql-abf0b6e)');
            console.log('   → Click "Power on" / start the service, then run this again.');
            console.log('');
            console.log('   Also check:');
            console.log('   • DB_HOST in backend/.env matches Aiven Overview');
            console.log('   • Internet connection is working');
        } else if (err.code === 'ECONNREFUSED') {
            console.log('💡 Connection refused. Check:');
            console.log('   1. Verify DB_PORT (20185) is correct');
            console.log('   2. Check Aiven firewall/whitelist settings');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('💡 Authentication failed. Check:');
            console.log('   1. Verify DB_USER and DB_PASSWORD in backend/.env');
        }
        return false;
    }
}

test().then(success => process.exit(success ? 0 : 1));
