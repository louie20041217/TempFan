-- ============================================================================
-- TempFan - Temperature-Based Automatic Fan Speed Control System
-- Database Schema for MySQL (XAMPP Environment)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `tempfan_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tempfan_db`;

-- 1. Readings Table: Stores DHT11 temperature/humidity and ESP32 fan telemetry
CREATE TABLE IF NOT EXISTS `readings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `temperature` DECIMAL(5,2) NOT NULL,
    `humidity` DECIMAL(5,2) NULL,
    `fan_speed` INT NOT NULL,
    `fan_status` VARCHAR(10) NOT NULL DEFAULT 'ON',
    `mode` VARCHAR(20) NOT NULL DEFAULT 'Automatic',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Thresholds Table: Temperature ranges and fan speed percentages
CREATE TABLE IF NOT EXISTS `thresholds` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `level_key` VARCHAR(20) NOT NULL UNIQUE,
    `level_name` VARCHAR(50) NOT NULL,
    `min_temp` DECIMAL(5,2) NULL,
    `max_temp` DECIMAL(5,2) NULL,
    `temp_label` VARCHAR(50) NOT NULL,
    `fan_speed` INT NOT NULL,
    `color_theme` VARCHAR(20) NOT NULL DEFAULT 'teal',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Settings Table: System control mode, manual override, and uptime metadata
CREATE TABLE IF NOT EXISTS `settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(50) NOT NULL UNIQUE,
    `setting_value` TEXT NOT NULL,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Users Table: Authentication accounts for IoT web management
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'IoT Technician',
    `avatar` MEDIUMTEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Password Resets Table: One pending Forgot Password code per user
CREATE TABLE IF NOT EXISTS `password_resets` (
    `user_id` INT NOT NULL PRIMARY KEY,
    `code_hash` VARCHAR(255) NOT NULL,
    `attempts` INT NOT NULL DEFAULT 0,
    `expires_at` DATETIME NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default Temperature Thresholds (Matching System Specifications)
INSERT INTO `thresholds` (`level_key`, `level_name`, `min_temp`, `max_temp`, `temp_label`, `fan_speed`, `color_theme`) VALUES
('low', 'Low Speed', NULL, 30.00, '≤ 30°C', 30, 'teal'),
('medium', 'Medium Speed', 31.00, 35.00, '31°C – 35°C', 60, 'amber'),
('high', 'High Speed', 36.00, NULL, '≥ 36°C', 100, 'coral')
ON DUPLICATE KEY UPDATE 
    `min_temp` = VALUES(`min_temp`),
    `max_temp` = VALUES(`max_temp`),
    `temp_label` = VALUES(`temp_label`),
    `fan_speed` = VALUES(`fan_speed`);

-- Seed Default Settings
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('control_mode', 'Automatic'),
('manual_fan_speed', '70'),
('system_status', 'offline'),
('hardware_platform', 'ESP32 Development Board'),
('temperature_sensor', 'DHT11 Temperature and Humidity Sensor')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- Seed Default Admin User
INSERT INTO `users` (`username`, `email`, `password_hash`, `role`) VALUES
('admin', 'admin@tempfan.io', '$2y$10$mqFiZnTMhfLe9ohaZzAB.u8gNW/CvSBONC67fmimav6ipx0PEF2Ti', 'Project Lead / IoT Developer')
ON DUPLICATE KEY UPDATE
    `email` = VALUES(`email`),
    `password_hash` = VALUES(`password_hash`),
    `role` = VALUES(`role`);

-- Seed Initial Reference Readings matching Dashboard & History design
INSERT INTO `readings` (`temperature`, `fan_speed`, `fan_status`, `mode`, `created_at`) VALUES
(29.8, 45, 'ON', 'Automatic', '2026-09-25 17:00:00'),
(30.5, 50, 'ON', 'Automatic', '2026-09-25 17:15:00'),
(31.2, 60, 'ON', 'Automatic', '2026-09-25 17:30:00'),
(31.8, 65, 'ON', 'Automatic', '2026-09-25 17:45:00'),
(32.0, 70, 'ON', 'Automatic', '2026-09-25 18:02:00')
ON DUPLICATE KEY UPDATE `temperature` = VALUES(`temperature`);
