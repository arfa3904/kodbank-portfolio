-- KODBANK App Database Schema (matches tutor's design)
-- Use this database on Aiven MySQL service

CREATE DATABASE IF NOT EXISTS bank_user;
USE bank_user;

-- Table 1: BankUser - stores bank user details (Cid, Cname, Cpwd, balance, email)
CREATE TABLE IF NOT EXISTS BankUser (
    Cid INT AUTO_INCREMENT PRIMARY KEY,
    Cname VARCHAR(100) NOT NULL,
    Cpwd VARCHAR(255) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    email VARCHAR(100) NOT NULL UNIQUE
);

-- Table 2: BankUserJwt - stores JWT tokens for authenticated users
CREATE TABLE IF NOT EXISTS BankUserJwt (
    tokenid INT AUTO_INCREMENT PRIMARY KEY,
    tokenvalue TEXT NOT NULL,
    Cid INT NOT NULL,
    exp TIMESTAMP NOT NULL,
    FOREIGN KEY (Cid) REFERENCES BankUser(Cid) ON DELETE CASCADE,
    INDEX idx_Cid (Cid),
    INDEX idx_exp (exp)
);

-- Sample data (as per image: Omkar, Abhaya with passwords and balances)
INSERT INTO BankUser (Cid, Cname, Cpwd, balance, email) VALUES
(1, 'Omkar', 'omkar', 500000.00, 'om@kod.com'),
(2, 'Abhaya', 'Abhay', 600000.00, 'ab@kod.com')
ON DUPLICATE KEY UPDATE
    Cname = VALUES(Cname),
    Cpwd = VALUES(Cpwd),
    balance = VALUES(balance),
    email = VALUES(email);
