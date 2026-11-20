-- MariaDB / MySQL Schema strictly aligned with Final Exam - App Dev Rubric
CREATE DATABASE IF NOT EXISTS blog_db;
USE blog_db;

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    encoder_id VARCHAR(50) NULL
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 3. Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash CHAR(64) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    author_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed Required Roles: 'reader', 'author', 'admin'
INSERT INTO roles (id, role) VALUES 
(1, 'reader'),
(2, 'author'),
(3, 'admin')
ON DUPLICATE KEY UPDATE role = VALUES(role);

-- Seed Initial Test Users (Password: password123 for all)
-- bcrypt hash for 'password123': $2a$10$fovTPqpMqJD4.1P9YUF6UudUOnzqAOc3Lxr73ijAecMFhHf633J8.
INSERT INTO users (id, email, username, password_hash, role_id, is_active) VALUES
(1, 'admin@example.com', 'admin_user', '$2a$10$fovTPqpMqJD4.1P9YUF6UudUOnzqAOc3Lxr73ijAecMFhHf633J8.', 3, 1),
(2, 'author@example.com', 'author_one', '$2a$10$fovTPqpMqJD4.1P9YUF6UudUOnzqAOc3Lxr73ijAecMFhHf633J8.', 2, 1),
(3, 'author2@example.com', 'author_two', '$2a$10$fovTPqpMqJD4.1P9YUF6UudUOnzqAOc3Lxr73ijAecMFhHf633J8.', 2, 1),
(4, 'reader@example.com', 'reader_user', '$2a$10$fovTPqpMqJD4.1P9YUF6UudUOnzqAOc3Lxr73ijAecMFhHf633J8.', 1, 1)
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Seed Initial Test Post
INSERT INTO posts (id, author_id, title, content) VALUES
(1, 2, 'Welcome to the Blog', 'This is an initial post created by author_one for verification.')
ON DUPLICATE KEY UPDATE title = VALUES(title);
