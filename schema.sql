-- Create database
CREATE DATABASE IF NOT EXISTS `pea` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pea`;

-- Create roles table
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create users table
CREATE TABLE `users` (
  `role_id` int(11) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `title_s_desc` varchar(10) DEFAULT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `dept_change_code` varchar(50) NOT NULL DEFAULT '',
  `dept_full` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`emp_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create system_master table
CREATE TABLE `system_master` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name_th` varchar(255) NOT NULL,
  `name_en` varchar(255) NOT NULL,
  `dept_change_code` varchar(255) NOT NULL DEFAULT '',
  `dept_full` varchar(255) NOT NULL DEFAULT '',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_dept_change_code` (`dept_change_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create system_details table
CREATE TABLE `system_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `system_id` int(11) DEFAULT NULL,
  `important_info` varchar(255) DEFAULT NULL,
  `reference_no` varchar(255) DEFAULT NULL,
  `additional_info` mediumtext NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `dept_change_code` varchar(50) NOT NULL DEFAULT '',
  `dept_full` varchar(255) NOT NULL DEFAULT '',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `system_id` (`system_id`),
  KEY `idx_dept_change_code` (`dept_change_code`),
  CONSTRAINT `system_details_ibfk_1` FOREIGN KEY (`system_id`) REFERENCES `system_master` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create activities table
CREATE TABLE `activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `system_id` int(11) DEFAULT NULL,
  `important_info` varchar(255) DEFAULT NULL,
  `details` text,
  `file_paths` text,
  `image_paths` text,
  `dept_change_code` varchar(50) NOT NULL,
  `dept_full` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `system_id` (`system_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_dept_change_code` (`dept_change_code`),
  CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`system_id`) REFERENCES `system_master` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `activities_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`emp_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default roles
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'user', 'ผู้ใช้งานทั่วไป'),
(2, 'admin', 'ผู้ดูแลระบบ'),
(3, 'superadmin', 'ผู้ดูแลระบบระดับสูง'); 