-- KODBANK App — Database Schema (MySQL / Aiven-compatible)
--
-- Three tables:
--   BankUser        customer accounts (password stored as a bcrypt hash, never plaintext)
--   BankUserJwt     server-side session record for each issued JWT (enables logout / revocation)
--   BankTransferLog immutable ledger of money transfers between accounts
--
-- Run once against a fresh database (from the repo root):
--   mysql -h HOST -P PORT -u USER -p DBNAME < database/database.sql
-- or paste this file into the Aiven "Query" console.

CREATE DATABASE IF NOT EXISTS bank_user;
USE bank_user;

-- ---------------------------------------------------------------------------
-- BankUser: one row per customer.
-- Cpwd holds a bcrypt hash (60 chars), never the raw password.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS BankUser (
    Cid        INT AUTO_INCREMENT PRIMARY KEY,
    Cname      VARCHAR(100) NOT NULL,
    Cpwd       VARCHAR(255) NOT NULL,       -- bcrypt hash
    balance    DECIMAL(15, 2) NOT NULL DEFAULT 500000.00,
    email      VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_balance_non_negative CHECK (balance >= 0)
);

-- ---------------------------------------------------------------------------
-- BankUserJwt: one row per active login session/token.
-- Deleted on logout or expiry so it doubles as a revocation list.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS BankUserJwt (
    tokenid    INT AUTO_INCREMENT PRIMARY KEY,
    tokenvalue TEXT NOT NULL,
    Cid        INT NOT NULL,
    exp        TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Cid) REFERENCES BankUser(Cid) ON DELETE CASCADE,
    INDEX idx_Cid (Cid),
    INDEX idx_exp (exp)
);

-- ---------------------------------------------------------------------------
-- BankTransferLog: append-only ledger. Every successful /transfer writes
-- exactly one row here, inside the same DB transaction as the balance update.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS BankTransferLog (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    sender_cid     INT NOT NULL,
    receiver_cid   INT NOT NULL,
    sender_label   VARCHAR(150) NOT NULL,
    receiver_label VARCHAR(150) NOT NULL,
    amount         DECIMAL(15, 2) NOT NULL,
    type           ENUM('transfer') NOT NULL DEFAULT 'transfer',
    reference      VARCHAR(255) NULL,
    status         ENUM('completed', 'failed') NOT NULL DEFAULT 'completed',
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_cid) REFERENCES BankUser(Cid) ON DELETE CASCADE,
    FOREIGN KEY (receiver_cid) REFERENCES BankUser(Cid) ON DELETE CASCADE,
    INDEX idx_sender (sender_cid),
    INDEX idx_receiver (receiver_cid),
    INDEX idx_created_at (created_at)
);

-- ---------------------------------------------------------------------------
-- Sample data. Passwords below are bcrypt hashes of the plaintext values
-- shown in the comments — never store plaintext passwords in a real table.
-- Generate your own with: node -e "console.log(require('bcryptjs').hashSync('yourpassword', 10))"
-- ---------------------------------------------------------------------------
-- Omkar   / password: "Omkar@123"
-- Abhaya  / password: "Abhaya@123"
INSERT INTO BankUser (Cid, Cname, Cpwd, balance, email) VALUES
(1, 'Omkar',  '$2a$10$UgF03OwYcZSNfPBNJDjLxOyTPV.2DONekEL8pmtmIUOc2dSdLXrlq', 500000.00, 'omkar@kodbank.dev'),
(2, 'Abhaya', '$2a$10$WzZc1mu82w.CUZjsIcGge.4Mk1W6wRpsizktrJqpD3.RG5LE86gBu', 600000.00, 'abhaya@kodbank.dev')
ON DUPLICATE KEY UPDATE
    Cname   = VALUES(Cname),
    balance = VALUES(balance),
    email   = VALUES(email);
