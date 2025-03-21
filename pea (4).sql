-- phpMyAdmin SQL Dump
-- version 4.9.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Mar 06, 2025 at 06:38 AM
-- Server version: 8.0.17
-- PHP Version: 7.3.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pea`
--

-- --------------------------------------------------------

--
-- Table structure for table `activities`
--

CREATE TABLE `activities` (
  `id` int(11) NOT NULL,
  `system_id` int(11) DEFAULT NULL,
  `important_info` varchar(255) DEFAULT NULL,
  `details` text,
  `file_paths` text,
  `image_paths` text,
  `dept_change_code` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `dept_full` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int(11) NOT NULL,
  `updated_by` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `activities_history`
--

CREATE TABLE `activities_history` (
  `id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `important_info_old` varchar(255) DEFAULT NULL,
  `important_info_new` varchar(255) DEFAULT NULL,
  `details_old` text,
  `details_new` text,
  `file_paths_old` text,
  `file_paths_new` text,
  `image_paths_old` text,
  `image_paths_new` text,
  `modified_by` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'user', 'ผู้ใช้งานทั่วไป', '2025-02-03 21:19:59'),
(2, 'admin', 'ผู้ดูแลระบบ', '2025-02-03 21:19:59'),
(3, 'superadmin', 'ผู้ดูแลระบบระดับสูง', '2025-02-03 21:19:59');

-- --------------------------------------------------------

--
-- Table structure for table `system_details`
--

CREATE TABLE `system_details` (
  `id` int(11) NOT NULL,
  `system_id` int(11) DEFAULT NULL,
  `important_info` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_no` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `additional_info` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `dept_change_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `dept_full` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_by` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_details_history`
--

CREATE TABLE `system_details_history` (
  `id` int(11) NOT NULL,
  `system_details_id` int(11) NOT NULL,
  `important_info_old` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `important_info_new` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_no_old` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_no_new` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `additional_info_old` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `additional_info_new` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `file_path_old` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `file_path_new` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `modified_by` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_master`
--

CREATE TABLE `system_master` (
  `id` int(11) NOT NULL,
  `name_th` varchar(255) NOT NULL,
  `name_en` varchar(255) NOT NULL,
  `dept_change_code` varchar(255) NOT NULL DEFAULT '',
  `dept_full` varchar(255) NOT NULL DEFAULT '',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` varchar(10) DEFAULT NULL,
  `updated_by` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `system_master`
--

INSERT INTO `system_master` (`id`, `name_th`, `name_en`, `dept_change_code`, `dept_full`, `created_at`, `is_active`, `created_by`, `updated_by`) VALUES
(59, 'จัดการค่าไฟ', 'id 1', '530105002000302', 'แผนกการเงิน', '2025-03-06 06:06:12', 1, '498146441', '498146441');

-- --------------------------------------------------------

--
-- Table structure for table `system_master_history`
--

CREATE TABLE `system_master_history` (
  `id` int(11) NOT NULL,
  `system_id` int(11) NOT NULL,
  `name_th_old` varchar(255) NOT NULL,
  `name_en_old` varchar(255) NOT NULL,
  `name_th_new` varchar(255) NOT NULL,
  `name_en_new` varchar(255) NOT NULL,
  `modified_by` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `system_master_history`
--

INSERT INTO `system_master_history` (`id`, `system_id`, `name_th_old`, `name_en_old`, `name_th_new`, `name_en_new`, `modified_by`, `modified_at`) VALUES
(5, 59, 'จัดการค่าไฟ', 'id', 'จัดการค่าไฟ', 'id 1', '498146441', '2025-03-06 06:07:47');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `role_id` int(11) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `title_s_desc` varchar(10) DEFAULT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `dept_change_code` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `dept_full` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`role_id`, `emp_id`, `title_s_desc`, `first_name`, `last_name`, `dept_change_code`, `dept_full`, `created_at`) VALUES
(3, 498146441, '', 'ปิยะพรพร', 'สุขสวัสดิ์ดิ', '530105002000302', 'แผนกการเงิน', '2025-02-04 01:46:24'),
(2, 498146446, '', 'สมชาย', 'ใจดี', '530105002000303', 'แผนกซ่อมบำรุง', '2025-02-03 23:13:44'),
(1, 498146450, '', 'ณัฐวุฒิ', 'แสงทอง', '530105002000307', 'แผนกจัดซื้อ', '2025-02-03 19:03:00'),
(3, 498146451, NULL, 'พรพิมล', 'เจริญสุข', '530105002000308', 'แผนกโลจิสติกส์', '2025-02-03 19:04:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `activities_history`
--
ALTER TABLE `activities_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_id` (`activity_id`);

--
-- Indexes for table `system_details`
--
ALTER TABLE `system_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `system_id` (`system_id`);

--
-- Indexes for table `system_details_history`
--
ALTER TABLE `system_details_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `system_details_id` (`system_details_id`);

--
-- Indexes for table `system_master`
--
ALTER TABLE `system_master`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_master_history`
--
ALTER TABLE `system_master_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `system_id` (`system_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activities`
--
ALTER TABLE `activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=125;

--
-- AUTO_INCREMENT for table `activities_history`
--
ALTER TABLE `activities_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `system_details`
--
ALTER TABLE `system_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `system_details_history`
--
ALTER TABLE `system_details_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `system_master`
--
ALTER TABLE `system_master`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `system_master_history`
--
ALTER TABLE `system_master_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activities_history`
--
ALTER TABLE `activities_history`
  ADD CONSTRAINT `fk_activities` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`);

--
-- Constraints for table `system_details`
--
ALTER TABLE `system_details`
  ADD CONSTRAINT `fk_system_details_system` FOREIGN KEY (`system_id`) REFERENCES `system_master` (`id`);

--
-- Constraints for table `system_details_history`
--
ALTER TABLE `system_details_history`
  ADD CONSTRAINT `fk_system_details_history` FOREIGN KEY (`system_details_id`) REFERENCES `system_details` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `system_master_history`
--
ALTER TABLE `system_master_history`
  ADD CONSTRAINT `fk_system_master` FOREIGN KEY (`system_id`) REFERENCES `system_master` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
