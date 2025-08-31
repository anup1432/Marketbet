
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(50) UNIQUE NOT NULL,
  ipAddress VARCHAR(45) NOT NULL,
  balance DECIMAL(15,2) DEFAULT 100.00,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  type ENUM('deposit', 'withdraw') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  network ENUM('trc20', 'polygon', 'ton', 'bep20') NOT NULL,
  address TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_status (status),
  INDEX idx_type (type)
);
