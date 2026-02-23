// Main server file
// Sets up Express server with routes and middleware

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { testConnection } = require('./db');
const authRoutes = require('./routes/auth');
const bankingRoutes = require('./routes/banking');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());  // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded bodies
app.use(cookieParser());  // Parse cookies

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Routes
app.use('/', authRoutes);  // Login route
app.use('/', bankingRoutes);  // Banking routes (check-balance, transfer)

// Root route - serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/login.html'));
});

// Start server
async function startServer() {
    // Test database connection before starting server
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
        console.error('❌ Failed to connect to database. Please check your .env file.');
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📁 Static files served from: ${path.join(__dirname, '../client')}`);
    });
}

startServer();
