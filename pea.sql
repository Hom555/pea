-- phpMyAdmin SQL Dump
-- version 4.9.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Apr 08, 2025 at 09:38 AM
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

--
-- Dumping data for table `activities`
--

INSERT INTO `activities` (`id`, `system_id`, `important_info`, `details`, `file_paths`, `image_paths`, `dept_change_code`, `dept_full`, `created_at`, `created_by`, `updated_by`) VALUES
(152, 76, '28', 'อัพเดตวินโดให้เป็นปัจุบัน ที่ติดตั้งไม่ได้', '/uploads/1742281648805-1713259465-16-04-20241-6340208110.pdf,/uploads/1742281648812-1713638596-21-04-20241-6340703109.pdf', NULL, '530105002000302', 'แผนกการเงิน', '2025-03-18 07:07:28', 498146441, NULL),
(153, 79, '29', 'การจัดการบัญชีลูกค้า', '/uploads/1742350273719-1712940905-12-04-20241-6340208114.pdf', '/uploads/1742350273725-image-W.jpg', '530105002000302', 'แผนกการเงิน', '2025-03-19 02:11:13', 498146441, NULL),
(162, 84, '30', '1.01', NULL, NULL, '530105002000303', 'แผนกซ่อมบำรุง', '2025-03-20 07:28:26', 498146447, '498146447');

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

--
-- Dumping data for table `activities_history`
--

INSERT INTO `activities_history` (`id`, `activity_id`, `important_info_old`, `important_info_new`, `details_old`, `details_new`, `file_paths_old`, `file_paths_new`, `image_paths_old`, `image_paths_new`, `modified_by`, `modified_at`) VALUES
(27, 162, '30', '30', '1', '1.01', NULL, NULL, NULL, NULL, '498146447', '2025-03-20 08:40:14');

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

--
-- Dumping data for table `system_details`
--

INSERT INTO `system_details` (`id`, `system_id`, `important_info`, `reference_no`, `additional_info`, `file_path`, `dept_change_code`, `dept_full`, `created_by`, `updated_by`, `created_at`) VALUES
(27, 76, 'การจักการลูกค้า', '2568', '', NULL, '530105002000302', 'แผนกการเงิน', '498146441', NULL, '2025-03-18 06:55:20'),
(28, 76, 'เวอร์ชั้น2.0', 'กปล.001/2568', 'ปรับปรุงการเชื่อมโยงข้อมูลทะเบียนราษฎร', '/uploads/1742281371149-1713416180-18-04-20241-6140208136.pdf', '530105002000302', 'แผนกการเงิน', '498146441', NULL, '2025-03-18 07:02:51'),
(29, 79, 'การชำระเงิน', '2568', '', '/uploads/1742350110085-1713416180-18-04-20241-6140208136.pdf,/uploads/1742350110088-1713259465-16-04-20241-6340208110.pdf', '530105002000302', 'แผนกการเงิน', '498146441', NULL, '2025-03-19 02:08:30'),
(30, 84, 'งานที่ทำ', '2560', '', NULL, '530105002000303', 'แผนกซ่อมบำรุง', '498146447', '498146447', '2025-03-19 08:44:26');

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

--
-- Dumping data for table `system_details_history`
--

INSERT INTO `system_details_history` (`id`, `system_details_id`, `important_info_old`, `important_info_new`, `reference_no_old`, `reference_no_new`, `additional_info_old`, `additional_info_new`, `file_path_old`, `file_path_new`, `modified_by`, `modified_at`) VALUES
(27, 30, 'งานที่ทำ', 'งานที่ทำ', '25460', '2560', '', '', NULL, NULL, '498146447', '2025-03-20 06:37:23');

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
(76, 'ระบบบริการลูกค้า1.0', 'ics 0.3', '530105002000302', 'แผนกการเงิน', '2025-03-18 06:52:17', 1, '498146441', '498146447'),
(79, 'การจัดการข้อมูลลูกค้า', '0.1050', '530105002000302', 'แผนกการเงิน', '2025-03-19 02:06:22', 1, '498146441', '498146447'),
(84, 'การงาน', '0.2.2', '530105002000303', 'แผนกซ่อมบำรุง', '2025-03-19 08:43:52', 1, '498146447', '498146447');

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
(37, 76, 'ระบบบริการลูกค้า', 'ics', 'ระบบบริการลูกค้า', 'ics 0.2', '498146441', '2025-03-18 06:52:33'),
(38, 76, 'ระบบบริการลูกค้า', 'ics 0.2', 'ระบบบริการลูกค้า', 'ics 0.3', '498146441', '2025-03-18 06:53:13'),
(39, 76, 'ระบบบริการลูกค้า', 'ics 0.3', 'ระบบบริการลูกค้า1.0', 'ics 0.3', '498146441', '2025-03-18 06:55:44'),
(41, 79, 'การจัดการข้อมูลลูกค้า', '0.1', 'การจัดการข้อมูลลูกค้า', '0.12', '498146447', '2025-03-19 07:46:34'),
(42, 79, 'การจัดการข้อมูลลูกค้า', '0.12', 'การจัดการข้อมูลลูกค้า', '0.1', '498146447', '2025-03-19 07:46:40'),
(43, 79, 'การจัดการข้อมูลลูกค้า', '0.1', 'การจัดการข้อมูลลูกค้า', '0.12', '498146447', '2025-03-19 07:50:23'),
(44, 76, 'ระบบบริการลูกค้า1.0', 'ics 0.3', 'ระบบบริการลูกค้า1.05', 'ics 0.3', '498146441', '2025-03-19 08:19:34'),
(46, 79, 'การจัดการข้อมูลลูกค้า', '0.12', 'การจัดการข้อมูลลูกค้า', '0.120', '498146447', '2025-03-19 08:45:13'),
(47, 84, 'การงาน', 'KF', 'การงาน', 'KF5', '498146447', '2025-03-20 03:15:14'),
(48, 79, 'การจัดการข้อมูลลูกค้า', '0.120', 'การจัดการข้อมูลลูกค้า', '0.1', '498146447', '2025-03-20 03:15:52'),
(49, 76, 'ระบบบริการลูกค้า1.05', 'ics 0.3', 'ระบบบริการลูกค้า1.0585555555555555555555555555', 'ics 0.3', '498146447', '2025-03-20 06:03:06'),
(50, 76, 'ระบบบริการลูกค้า1.0585555555555555555555555555', 'ics 0.3', 'ระบบบริการลูกค้า1.0', 'ics 0.3', '498146447', '2025-03-20 06:03:16'),
(51, 84, 'การงาน', 'KF5', 'การงาน', 'KF55', '498146447', '2025-03-20 06:36:47'),
(52, 84, 'การงาน', 'KF55', 'การงาน', 'KF557', '498146447', '2025-03-20 06:44:04'),
(59, 79, 'การจัดการข้อมูลลูกค้า', '0.1', 'การจัดการข้อมูลลูกค้า', '0.10', '498146447', '2025-03-21 03:23:09'),
(60, 79, 'การจัดการข้อมูลลูกค้า', '0.10', 'การจัดการข้อมูลลูกค้า', '0.101', '498146447', '2025-03-21 03:41:37'),
(61, 84, 'การงาน', 'KF557', 'การงาน', 'KF55', '498146447', '2025-03-21 03:47:09'),
(62, 79, 'การจัดการข้อมูลลูกค้า', '0.101', 'การจัดการข้อมูลลูกค้า', '0.10', '498146447', '2025-03-21 03:47:13'),
(63, 79, 'การจัดการข้อมูลลูกค้า', '0.10', 'การจัดการข้อมูลลูกค้า', '0.105', '498146447', '2025-03-21 03:54:19'),
(64, 84, 'การงาน', 'KF55', 'การงาน', 'KF555', '498146447', '2025-03-21 03:54:33'),
(66, 79, 'การจัดการข้อมูลลูกค้า', '0.105', 'การจัดการข้อมูลลูกค้า', '0.1050', '498146447', '2025-03-21 07:23:51'),
(67, 84, 'การงาน', 'KF555', 'การงาน', '0.2.2', '498146447', '2025-03-31 09:13:28');

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
(3, 498146451, NULL, 'พรพิมล', 'เจริญสุข', '530105002000308', 'แผนกโลจิสติกส์', '2025-02-03 19:04:00'),
(3, 498146447, '', 'สม', 'ใจดี', '530105002000303', 'แผนกซ่อมบำรุง', '2025-03-19 08:43:02');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=170;

--
-- AUTO_INCREMENT for table `activities_history`
--
ALTER TABLE `activities_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `system_details`
--
ALTER TABLE `system_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `system_details_history`
--
ALTER TABLE `system_details_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `system_master`
--
ALTER TABLE `system_master`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=90;

--
-- AUTO_INCREMENT for table `system_master_history`
--
ALTER TABLE `system_master_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

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
