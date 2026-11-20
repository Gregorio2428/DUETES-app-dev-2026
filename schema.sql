-- MariaDB / MySQL Schema for Blog Platform Final Exam
CREATE DATABASE IF NOT EXISTS blog_db;
USE blog_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed Initial Data (Password: password123)
-- bcrypt hash for 'password123': $2a$10$wT80W3bB4mC2N/w.7Gv8U.gQYgQd1O3wI2rL/0hXoH7eHsmP.5Rz6
INSERT IGNORE INTO users (id, username, email, password, role) VALUES
(1, 'admin', 'admin@example.com', '$2a$10$wT80W3bB4mC2N/w.7Gv8U.gQYgQd1O3wI2rL/0hXoH7eHsmP.5Rz6', 'admin'),
(2, 'johndoe', 'john@example.com', '$2a$10$wT80W3bB4mC2N/w.7Gv8U.gQYgQd1O3wI2rL/0hXoH7eHsmP.5Rz6', 'user');

INSERT IGNORE INTO posts (id, title, content, author_id) VALUES
(1, 'Welcome to the Final Exam Blog', 'This is a sample post verifying that MariaDB and the backend are connected correctly.', 1);
