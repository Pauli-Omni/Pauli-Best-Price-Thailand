-- Minimal future table for purchase / basket verification (e.g. 59 THB tier).
-- NOT connected to server.js yet — run manually after your developer wires routes.
-- MySQL / MariaDB (cPanel): create database user in cPanel, then import.

CREATE TABLE IF NOT EXISTS osg_purchase_verify_stub (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  customer_stub VARCHAR(120) NULL,
  amount_thb DECIMAL(12,2) NOT NULL,
  channel VARCHAR(48) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  notes VARCHAR(255) NULL,
  PRIMARY KEY (id),
  KEY idx_status (status),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SQLite (if you use a VPS): use INTEGER PRIMARY KEY AUTOINCREMENT and REAL for amount_thb.
