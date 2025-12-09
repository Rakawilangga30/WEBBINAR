-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Dec 09, 2025 at 05:28 PM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `proyek3db`
--

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` bigint NOT NULL,
  `organization_id` bigint NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `category` varchar(100) DEFAULT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `publish_status` enum('DRAFT','PUBLISHED','SCHEDULED') DEFAULT 'DRAFT',
  `publish_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `organization_id`, `title`, `description`, `category`, `thumbnail_url`, `is_published`, `created_at`, `updated_at`, `publish_status`, `publish_at`) VALUES
(2, 3, 'Belajar Golang untuk Pemula', 'Webinar lengkap belajar Golang dari dasar sampai mahir.', 'Programming', NULL, 0, '2025-11-30 11:57:40', '2025-11-30 20:28:41', 'PUBLISHED', NULL),
(3, 3, 'event belajar berbayar', 'test bikin event', 'Programming', NULL, 0, '2025-12-09 17:26:30', '2025-12-09 17:26:30', 'DRAFT', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `organizations`
--

CREATE TABLE `organizations` (
  `id` bigint NOT NULL,
  `owner_user_id` bigint NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `description` text,
  `category` varchar(100) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `organizations`
--

INSERT INTO `organizations` (`id`, `owner_user_id`, `name`, `description`, `category`, `logo_url`, `email`, `phone`, `website`, `created_at`) VALUES
(3, 6, 'Programmer Academy', 'Lembaga edukasi programming', 'Education', 'https://example.com/logo.png', 'academy@example.com', '08123456789', 'https://academy.example.com', '2025-11-30 11:54:47');

-- --------------------------------------------------------

--
-- Table structure for table `organization_applications`
--

CREATE TABLE `organization_applications` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `org_name` varchar(150) NOT NULL,
  `org_description` text,
  `org_category` varchar(100) DEFAULT NULL,
  `org_logo_url` varchar(255) DEFAULT NULL,
  `org_email` varchar(150) DEFAULT NULL,
  `org_phone` varchar(50) DEFAULT NULL,
  `org_website` varchar(255) DEFAULT NULL,
  `reason` text,
  `social_media` text,
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `reviewed_by` bigint DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_note` text,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `organization_applications`
--

INSERT INTO `organization_applications` (`id`, `user_id`, `org_name`, `org_description`, `org_category`, `org_logo_url`, `org_email`, `org_phone`, `org_website`, `reason`, `social_media`, `status`, `reviewed_by`, `reviewed_at`, `review_note`, `submitted_at`) VALUES
(2, 6, 'Programmer Academy', 'Lembaga edukasi programming', 'Education', 'https://example.com/logo.png', 'academy@example.com', '08123456789', 'https://academy.example.com', 'Ingin membuat webinar programming', '@academy', 'APPROVED', 3, '2025-11-30 04:54:47', 'Valid dan sesuai syarat', '2025-11-30 04:52:42');

-- --------------------------------------------------------

--
-- Table structure for table `purchases`
--

CREATE TABLE `purchases` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `session_id` bigint NOT NULL,
  `price_paid` double NOT NULL,
  `purchased_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `purchases`
--

INSERT INTO `purchases` (`id`, `user_id`, `session_id`, `price_paid`, `purchased_at`) VALUES
(1, 7, 1, 0, '2025-12-06 18:25:30'),
(2, 8, 1, 0, '2025-12-09 22:51:24');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int NOT NULL,
  `name` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`) VALUES
(3, 'ADMIN'),
(2, 'ORGANIZATION'),
(1, 'USER');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` bigint NOT NULL,
  `event_id` bigint NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `price` int DEFAULT '0',
  `order_index` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `publish_status` enum('DRAFT','PUBLISHED','SCHEDULED') DEFAULT 'DRAFT',
  `publish_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `event_id`, `title`, `description`, `price`, `order_index`, `created_at`, `publish_status`, `publish_at`) VALUES
(1, 2, 'Introduction', 'Dasar golang', 0, 1, '2025-11-30 12:15:28', 'PUBLISHED', '2025-12-05 08:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `session_files`
--

CREATE TABLE `session_files` (
  `id` bigint NOT NULL,
  `session_id` bigint NOT NULL,
  `title` varchar(255) NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `size_bytes` bigint DEFAULT '0',
  `order_index` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `session_files`
--

INSERT INTO `session_files` (`id`, `session_id`, `title`, `file_url`, `size_bytes`, `order_index`, `created_at`) VALUES
(1, 1, 'Transkrip.pdf', 'uploads/files/session_1_1764505346.pdf', 290731, 1, '2025-11-30 12:22:27');

-- --------------------------------------------------------

--
-- Table structure for table `session_videos`
--

CREATE TABLE `session_videos` (
  `id` bigint NOT NULL,
  `session_id` bigint NOT NULL,
  `title` varchar(255) NOT NULL,
  `video_url` varchar(255) NOT NULL,
  `size_bytes` bigint DEFAULT '0',
  `order_index` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `session_videos`
--

INSERT INTO `session_videos` (`id`, `session_id`, `title`, `video_url`, `size_bytes`, `order_index`, `created_at`) VALUES
(1, 1, 'Roblox-2025-11-16T04_30_50.961Z.mp4', 'uploads/videos/session_1_1764505284.mp4', 3315805, 1, '2025-11-30 12:21:25'),
(3, 1, 'sesi1.mp4', 'uploads/videos/session_1_1765297924.mp4', 3315805, 3, '2025-12-09 16:32:04'),
(4, 1, '2025-05-27 21-09-07.mp4', 'uploads/videos/session_1_1765300423.mp4', 73994757, 4, '2025-12-09 17:13:44');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `phone` varchar(50) DEFAULT NULL,
  `profile_img` varchar(255) DEFAULT NULL,
  `bio` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `created_at`, `phone`, `profile_img`, `bio`) VALUES
(3, 'Admin', 'admin@gmail.com', '$2a$14$N6oGzH7Us2Rj6qk4mvMWcuNej0pmhuNG3v2zMxTRNBRNX2v9BPyka', '2025-11-24 10:15:43', NULL, NULL, NULL),
(5, 'Miqdam', 'Miqdam@gmail.com.com', '$2a$10$3gPo0OPkmeuX.AQvLNve4uQy7HxjCOLNDtRZPPu8GIwZNPpp67gQO', '2025-11-24 11:43:32', NULL, 'uploads/profile/user_5_1764245081.jpg', NULL),
(6, 'Raka', 'rakaacademy@gmail.com', '$2a$14$mxwRh9bgvTmhVwRxxtY4hOT/GSmltg6BimFEVNdMucW3un8Q/RGnu', '2025-11-30 11:51:25', NULL, NULL, NULL),
(7, 'user', 'user@gmail.com', '$2a$14$y6D8jQm5mCi.5BVcCnpfauWBCpgu/j6fgcbUFkQP4N2aB.SKpOecu', '2025-12-06 11:23:53', NULL, NULL, NULL),
(8, 'pembeli', 'beli@gmail.com', '$2a$14$EU8Vx9/FNRUaccG8Z7fBy.GGM6x7uTdU0fCoVfaPWKEnDSPC2TA0y', '2025-12-09 15:51:08', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` bigint NOT NULL,
  `role_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(5, 1),
(7, 1),
(8, 1),
(6, 2),
(3, 3);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_events_org` (`organization_id`);

--
-- Indexes for table `organizations`
--
ALTER TABLE `organizations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `organization_applications`
--
ALTER TABLE `organization_applications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`session_id`),
  ADD KEY `session_id` (`session_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_sessions_event` (`event_id`);

--
-- Indexes for table `session_files`
--
ALTER TABLE `session_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_session_files_session` (`session_id`);

--
-- Indexes for table `session_videos`
--
ALTER TABLE `session_videos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_session_videos_session` (`session_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `organizations`
--
ALTER TABLE `organizations`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `organization_applications`
--
ALTER TABLE `organization_applications`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `purchases`
--
ALTER TABLE `purchases`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `session_files`
--
ALTER TABLE `session_files`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `session_videos`
--
ALTER TABLE `session_videos`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `fk_events_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`);

--
-- Constraints for table `purchases`
--
ALTER TABLE `purchases`
  ADD CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `purchases_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`);

--
-- Constraints for table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `fk_sessions_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`);

--
-- Constraints for table `session_files`
--
ALTER TABLE `session_files`
  ADD CONSTRAINT `fk_session_files_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`);

--
-- Constraints for table `session_videos`
--
ALTER TABLE `session_videos`
  ADD CONSTRAINT `fk_session_videos_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`);

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
