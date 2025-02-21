-- phpMyAdmin SQL Dump
-- version 4.9.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Feb 18, 2025 at 07:10 AM
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
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `activities`
--

INSERT INTO `activities` (`id`, `system_id`, `important_info`, `details`, `file_paths`, `image_paths`, `dept_change_code`, `dept_full`, `created_at`, `created_by`) VALUES
(1, 1, 'กิจกรรมที่ 1', 'รายละเอียดกิจกรรม 1', NULL, NULL, '', '', '2025-01-28 13:36:35', NULL),
(2, 2, 'กิจกรรมที่ 2', 'รายละเอียดกิจกรรม 2', NULL, NULL, '', '', '2025-01-28 13:36:35', NULL),
(29, 23, '64', '11', NULL, NULL, '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-02-13 04:13:37', 498146444),
(30, 23, '64', '234', '/uploads/1739499700677-pea (4).sql', '', '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-02-14 02:21:40', 498146444),
(31, 23, '64', '121', '/uploads/1739524753617-บทที่ 2.docx', '/uploads/1739758637134-image-W.jpg', '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-02-14 09:19:13', 498146444),
(32, 22, '62', '1155', '/uploads/1739761329305-บทที่ 2.docx', '/uploads/1739761329307-Firefly ไก่ 66770.jpg', '530105002000302', 'แผนกการเงิน', '2025-02-17 03:02:09', 498146441),
(33, 22, '62', '11', NULL, NULL, '530105002000302', 'แผนกการเงิน', '2025-02-18 02:49:04', 498146441);

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
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dept_change_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `dept_full` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_details`
--

INSERT INTO `system_details` (`id`, `system_id`, `important_info`, `reference_no`, `additional_info`, `file_path`, `dept_change_code`, `dept_full`, `created_at`) VALUES
(1, 1, 'oo', '44', '', '/uploads/1738117030286-zn2g2t.docx', '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-01-28 02:09:15'),
(29, 13, 'rr', '474', '', '', '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-01-28 01:48:45'),
(30, 13, 'rr', '474', '', '', '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-01-28 01:49:02'),
(49, 1, 'กด', '45454', 'ไก่', '', '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-01-30 00:17:07'),
(50, 1, 'พด', '44455', 'พด', '/uploads/1738221467276-fcmij.docx', '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-01-30 00:17:47'),
(54, 23, '2', '2', '2', NULL, '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-02-07 08:10:25'),
(55, 23, '2', '2', '2', NULL, '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-02-07 08:18:23'),
(58, 23, '2', '2', '2', NULL, '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-02-07 08:28:06'),
(59, 23, '1', '2', '3', NULL, '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-02-07 08:28:29'),
(60, 22, '1', '2', '33', NULL, '530105002000302', 'แผนกการเงิน', '2025-02-07 08:30:31'),
(62, 22, '12', '2', '1', NULL, '530105002000302', 'แผนกการเงิน', '2025-02-10 02:02:09'),
(64, 23, 'กด', '123', '3444', NULL, '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-02-10 06:41:39'),
(73, 23, '1', '1', '11', '/uploads/1739757307375-1739524753617-บทที่ 2.docx', '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-02-14 06:46:55');

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
  `is_active` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `system_master`
--

INSERT INTO `system_master` (`id`, `name_th`, `name_en`, `dept_change_code`, `dept_full`, `created_at`, `is_active`) VALUES
(2, 'ระบบรับชำระเงิน', 'BPM', '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-01-02 02:34:28', 1),
(4, 'เทส', 'test', '530105002000304', 'แผนกพัฒนาระบบงานด้านการวิเคราะห์ข้อมูล', '2025-01-07 22:02:08', 1),
(5, 'AABBCC', 'EE', '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-01-12 03:07:48', 1),
(6, 'ระบบการจัดการ', 'EST', '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-01-13 04:16:22', 1),
(22, 'ไก่ไทย', '2', '530105002000302', 'แผนกการเงิน', '2025-02-07 06:51:11', 1),
(23, 'ไก่ไทย', 'KFC', '530105002000301', 'แผนกพัฒนาระบบงานด้านการเงิน', '2025-02-07 07:25:20', 1);

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
(3, 498146441, NULL, 'ปิยะพรพร', 'สุขสวัสดิ์ดิ', '530105002000302', 'แผนกการเงิน', '2025-02-04 01:46:24'),
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
-- Indexes for table `system_details`
--
ALTER TABLE `system_details`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_master`
--
ALTER TABLE `system_master`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activities`
--
ALTER TABLE `activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `system_details`
--
ALTER TABLE `system_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;

--
-- AUTO_INCREMENT for table `system_master`
--
ALTER TABLE `system_master`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
