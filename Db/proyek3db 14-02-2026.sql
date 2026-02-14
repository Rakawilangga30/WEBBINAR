-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Feb 14, 2026 at 08:28 AM
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
-- Table structure for table `ad_banners`
--

CREATE TABLE `ad_banners` (
  `id` bigint NOT NULL,
  `title` varchar(255) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `target_url` varchar(500) DEFAULT NULL,
  `placement` enum('BANNER_SLIDER','SIDEBAR_LEFT','SIDEBAR_RIGHT') DEFAULT 'SIDEBAR_RIGHT',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `order_index` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ad_banners`
--

INSERT INTO `ad_banners` (`id`, `title`, `image_url`, `target_url`, `placement`, `start_date`, `end_date`, `is_active`, `order_index`, `created_at`, `created_by`) VALUES
(2, 'PROMO', 'uploads\\ads\\ad_1768392092181575900_a811f271.jpeg', 'https://bisa.ai/', 'SIDEBAR_LEFT', '2026-01-14', '2026-01-15', 1, 0, '2026-01-14 19:01:32', 11),
(3, 'iklan 2', 'uploads\\ads\\ad_1768393562598927800_37a97dde.png', 'https://www.instagram.com/ulbi.official/', 'SIDEBAR_LEFT', '2026-01-14', '2026-01-30', 1, 0, '2026-01-14 19:26:02', 11);

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_applications`
--

CREATE TABLE `affiliate_applications` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `motivation` text,
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `reviewed_by` bigint DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `review_note` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_balances`
--

CREATE TABLE `affiliate_balances` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `balance` decimal(15,2) DEFAULT '0.00',
  `total_earned` decimal(15,2) DEFAULT '0.00',
  `total_withdrawn` decimal(15,2) DEFAULT '0.00',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `affiliate_balances`
--

INSERT INTO `affiliate_balances` (`id`, `user_id`, `balance`, `total_earned`, `total_withdrawn`, `updated_at`) VALUES
(7, 21, '61000.00', '61000.00', '50000.00', '2026-01-14 14:17:43');

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_partnerships`
--

CREATE TABLE `affiliate_partnerships` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL COMMENT 'Affiliate user',
  `event_id` bigint NOT NULL COMMENT 'Target event to promote',
  `organization_id` bigint NOT NULL,
  `unique_code` varchar(50) NOT NULL COMMENT 'Promo code: EVENTNAME-USERID',
  `commission_percentage` decimal(5,2) NOT NULL DEFAULT '10.00',
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `approved_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `approved_by` bigint DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `bank_name` varchar(50) DEFAULT NULL,
  `bank_account` varchar(50) DEFAULT NULL,
  `bank_account_name` varchar(100) DEFAULT NULL,
  `social_media` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `affiliate_partnerships`
--

INSERT INTO `affiliate_partnerships` (`id`, `user_id`, `event_id`, `organization_id`, `unique_code`, `commission_percentage`, `status`, `created_at`, `approved_at`, `expires_at`, `is_active`, `approved_by`, `phone`, `bank_name`, `bank_account`, `bank_account_name`, `social_media`) VALUES
(3, 21, 23, 3, 'AFFILIATE1', '10.00', 'APPROVED', '2026-01-13 23:02:09', '2026-01-13 23:03:00', '2026-01-15 00:00:00', 1, 6, '085432103564', 'BCA', '173123412', 'AFFILIATE !', 'ganteng banget gweh');

-- --------------------------------------------------------

--
-- Table structure for table `carts`
--

CREATE TABLE `carts` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `affiliate_code` varchar(50) DEFAULT NULL COMMENT 'Applied affiliate promo code',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `carts`
--

INSERT INTO `carts` (`id`, `user_id`, `affiliate_code`, `created_at`, `updated_at`) VALUES
(1, 6, NULL, '2026-01-11 19:31:17', '2026-01-14 21:16:30'),
(2, 17, NULL, '2026-01-11 20:09:56', '2026-01-16 11:23:47'),
(3, 8, NULL, '2026-01-11 21:24:32', '2026-01-13 23:25:58'),
(4, 7, NULL, '2026-01-11 22:25:59', '2026-01-14 21:17:43'),
(5, 11, NULL, '2026-01-12 20:47:06', '2026-01-12 20:47:06'),
(6, 18, NULL, '2026-01-13 22:21:13', '2026-01-13 22:21:13');

-- --------------------------------------------------------

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` bigint NOT NULL,
  `cart_id` bigint NOT NULL,
  `item_type` enum('SESSION','EVENT_PACKAGE') NOT NULL DEFAULT 'SESSION',
  `session_id` bigint DEFAULT NULL,
  `event_id` bigint DEFAULT NULL COMMENT 'For EVENT_PACKAGE type',
  `price` decimal(15,2) NOT NULL,
  `added_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `cart_items`
--

INSERT INTO `cart_items` (`id`, `cart_id`, `item_type`, `session_id`, `event_id`, `price`, `added_at`) VALUES
(2, 2, 'SESSION', 23, NULL, '10000.00', '2026-01-11 20:09:56'),
(13, 5, 'SESSION', 23, NULL, '10000.00', '2026-01-12 21:43:03'),
(14, 5, 'SESSION', 24, NULL, '50000.00', '2026-01-12 21:43:04'),
(28, 1, 'SESSION', 23, NULL, '10000.00', '2026-01-21 01:36:02');

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
  `publish_at` datetime DEFAULT NULL,
  `affiliate_submission_id` bigint DEFAULT NULL,
  `package_price` decimal(15,2) DEFAULT NULL COMMENT 'Price for buying all sessions as bundle (null = no bundle)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `organization_id`, `title`, `description`, `category`, `thumbnail_url`, `is_published`, `created_at`, `updated_at`, `publish_status`, `publish_at`, `affiliate_submission_id`, `package_price`) VALUES
(23, 3, 'Belajar Golang', 'belajar dasar ', 'Teknologi', 'uploads/events/event_thumb_23_1768132936.png', 0, '2026-01-11 12:02:16', '2026-01-11 19:30:19', 'PUBLISHED', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `event_certificates`
--

CREATE TABLE `event_certificates` (
  `id` bigint NOT NULL,
  `event_id` bigint NOT NULL,
  `is_enabled` tinyint(1) DEFAULT '0',
  `min_score_percent` int DEFAULT '80',
  `certificate_title` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `featured_events`
--

CREATE TABLE `featured_events` (
  `id` bigint NOT NULL,
  `event_id` bigint NOT NULL,
  `order_index` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `financial_transactions`
--

CREATE TABLE `financial_transactions` (
  `id` bigint NOT NULL,
  `transaction_type` enum('SALE','AFFILIATE_CREDIT','PLATFORM_FEE','WITHDRAWAL') NOT NULL,
  `entity_type` enum('ORGANIZATION','AFFILIATE','PLATFORM') NOT NULL,
  `entity_id` bigint NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text,
  `reference_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `financial_transactions`
--

INSERT INTO `financial_transactions` (`id`, `transaction_type`, `entity_type`, `entity_id`, `amount`, `description`, `reference_id`, `created_at`) VALUES
(12, 'SALE', 'ORGANIZATION', 3, '10000.00', 'Penjualan sesi ID 23', 'ORDER-1768143627-23-8', '2026-01-11 15:00:42'),
(13, 'SALE', 'ORGANIZATION', 3, '50000.00', 'Penjualan session ID 24', 'CART-1768144271-3-8', '2026-01-11 15:11:41'),
(14, 'SALE', 'ORGANIZATION', 3, '10000.00', 'Penjualan session ID 23', 'CART-1768144590-3-8', '2026-01-11 15:16:45'),
(15, 'SALE', 'ORGANIZATION', 3, '50000.00', 'Penjualan session ID 24', 'CART-1768144590-3-8', '2026-01-11 15:16:45'),
(16, 'SALE', 'ORGANIZATION', 3, '10000.00', 'Penjualan sesi ID 23', 'ORDER-1768144735-23-7', '2026-01-11 15:19:11'),
(17, 'SALE', 'ORGANIZATION', 3, '50000.00', 'Penjualan session ID 24', 'CART-1768145170-4-7', '2026-01-11 15:26:25'),
(18, 'SALE', 'ORGANIZATION', 3, '50000.00', 'Penjualan sesi ID 24', 'ORDER-1768317675-24-18', '2026-01-13 15:21:46'),
(19, 'SALE', 'ORGANIZATION', 3, '10000.00', 'Penjualan session ID 23', 'CART-1768317722-6-18', '2026-01-13 15:22:30'),
(20, 'SALE', 'ORGANIZATION', 3, '10000.00', 'Penjualan sesi ID 23', 'ORDER-1768320307-23-8', '2026-01-13 16:05:22'),
(21, 'AFFILIATE_CREDIT', 'AFFILIATE', 21, '5000.00', 'Komisi dari session ID 24', 'CART-1768320348-3-8', '2026-01-13 16:06:01'),
(22, 'SALE', 'ORGANIZATION', 3, '50000.00', 'Penjualan session ID 24', 'CART-1768320348-3-8', '2026-01-13 16:06:01'),
(23, 'AFFILIATE_CREDIT', 'AFFILIATE', 21, '1000.00', 'Komisi dari session ID 23', 'CART-1768320784-3-8', '2026-01-13 16:13:20'),
(24, 'SALE', 'ORGANIZATION', 3, '10000.00', 'Penjualan session ID 23', 'CART-1768320784-3-8', '2026-01-13 16:13:20'),
(25, 'AFFILIATE_CREDIT', 'AFFILIATE', 21, '5000.00', 'Komisi dari session ID 24', 'CART-1768320784-3-8', '2026-01-13 16:13:20'),
(26, 'SALE', 'ORGANIZATION', 3, '50000.00', 'Penjualan session ID 24', 'CART-1768320784-3-8', '2026-01-13 16:13:20'),
(27, 'AFFILIATE_CREDIT', 'AFFILIATE', 21, '1000.00', 'Komisi dari session ID 23', 'CART-1768321543-3-8', '2026-01-13 16:25:58'),
(28, 'SALE', 'ORGANIZATION', 3, '10000.00', 'Penjualan session ID 23', 'CART-1768321543-3-8', '2026-01-13 16:25:58'),
(29, 'AFFILIATE_CREDIT', 'AFFILIATE', 21, '5000.00', 'Komisi dari session ID 24', 'CART-1768321543-3-8', '2026-01-13 16:25:58'),
(30, 'SALE', 'ORGANIZATION', 3, '50000.00', 'Penjualan session ID 24', 'CART-1768321543-3-8', '2026-01-13 16:25:58'),
(31, 'AFFILIATE_CREDIT', 'AFFILIATE', 21, '5000.00', 'Komisi dari session ID 24', 'CART-1768400168-1-6', '2026-01-14 14:16:30'),
(32, 'SALE', 'ORGANIZATION', 3, '50000.00', 'Penjualan session ID 24', 'CART-1768400168-1-6', '2026-01-14 14:16:30'),
(33, 'AFFILIATE_CREDIT', 'AFFILIATE', 21, '1000.00', 'Komisi dari session ID 23', 'CART-1768400248-4-7', '2026-01-14 14:17:43'),
(34, 'SALE', 'ORGANIZATION', 3, '10000.00', 'Penjualan session ID 23', 'CART-1768400248-4-7', '2026-01-14 14:17:43'),
(35, 'AFFILIATE_CREDIT', 'AFFILIATE', 21, '5000.00', 'Komisi dari session ID 24', 'CART-1768400248-4-7', '2026-01-14 14:17:43'),
(36, 'SALE', 'ORGANIZATION', 3, '50000.00', 'Penjualan session ID 24', 'CART-1768400248-4-7', '2026-01-14 14:17:43');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `is_read`, `created_at`) VALUES
(119, 6, 'affiliate_request', '👥 Permintaan Affiliate Baru', 'Ada user baru yang ingin menjadi affiliate untuk event \"Belajar Golang\"', 1, '2026-01-11 12:30:44'),
(120, 6, 'affiliate_request', '👥 Permintaan Affiliate Baru', 'Ada user baru yang ingin menjadi affiliate untuk event \"Belajar Golang\"', 1, '2026-01-11 12:43:51'),
(121, 17, 'affiliate_approved', '✅ Permintaan Affiliate Disetujui!', 'Anda sekarang affiliate untuk event \"Belajar Golang\". Kode promo Anda: BELAJARBARENGBUDI (Komisi: 10%)', 1, '2026-01-11 12:49:31'),
(122, 8, 'purchase_success', '✅ Pembayaran Berhasil!', 'Pembelian Anda telah berhasil. Silakan akses konten yang telah dibeli.', 1, '2026-01-11 15:00:42'),
(123, 6, 'new_purchase', '💰 Pembelian Baru!', 'customer 1 membeli sesi \"percobaan\" dari event \"Belajar Golang\"', 1, '2026-01-11 15:00:42'),
(124, 8, 'purchase_success', '✅ Pembayaran Berhasil!', 'Pembelian 1 item berhasil. Silakan akses konten Anda.', 1, '2026-01-11 15:11:41'),
(125, 8, 'purchase_success', '✅ Pembayaran Berhasil!', 'Pembelian 2 item berhasil. Silakan akses konten Anda.', 1, '2026-01-11 15:16:46'),
(126, 7, 'purchase_success', '✅ Pembayaran Berhasil!', 'Pembelian Anda telah berhasil. Silakan akses konten yang telah dibeli.', 0, '2026-01-11 15:19:11'),
(127, 6, 'new_purchase', '💰 Pembelian Baru!', 'admin kecil membeli sesi \"percobaan\" dari event \"Belajar Golang\"', 1, '2026-01-11 15:19:11'),
(128, 7, 'purchase_success', '✅ Pembayaran Berhasil!', 'Pembelian 1 item berhasil. Silakan akses konten Anda.', 0, '2026-01-11 15:26:25'),
(129, 11, 'new_report', '📢 Laporan Baru', 'Ada laporan baru: tolooong', 1, '2026-01-12 14:11:36'),
(130, 18, 'purchase_success', '✅ Pembayaran Berhasil!', 'Pembelian Anda telah berhasil. Silakan akses konten yang telah dibeli.', 1, '2026-01-13 15:21:47'),
(131, 6, 'new_purchase', '💰 Pembelian Baru!', 'aku baru membeli sesi \"sesi 2\" dari event \"Belajar Golang\"', 1, '2026-01-13 15:21:47'),
(132, 18, 'purchase_success', '✅ Pembayaran Berhasil!', 'Pembelian 1 item berhasil. Silakan akses konten Anda.', 1, '2026-01-13 15:22:30'),
(133, 6, 'affiliate_request', '👥 Permintaan Affiliate Baru', 'Ada user baru yang ingin menjadi affiliate untuk event \"Belajar Golang\"', 1, '2026-01-13 16:02:09'),
(134, 21, 'affiliate_approved', '✅ Permintaan Affiliate Disetujui!', 'Anda sekarang affiliate untuk event \"Belajar Golang\". Kode promo Anda: AFFILIATE1 (Komisi: 10%)', 1, '2026-01-13 16:03:01'),
(135, 8, 'purchase_success', '✅ Pembayaran Berhasil!', 'Pembelian Anda telah berhasil. Silakan akses konten yang telah dibeli.', 1, '2026-01-13 16:05:22'),
(136, 6, 'new_purchase', '💰 Pembelian Baru!', 'customer 1 membeli sesi \"percobaan\" dari event \"Belajar Golang\"', 1, '2026-01-13 16:05:22'),
(137, 21, 'affiliate_sale', '🛒 Penjualan dari Kode Promo!', 'Anda mendapat komisi Rp 5000 dari penjualan', 1, '2026-01-13 16:06:02'),
(138, 8, 'purchase_success', '✅ Pembayaran Berhasil!', 'Pembelian 1 item berhasil. Silakan akses konten Anda.', 1, '2026-01-13 16:06:02'),
(139, 21, 'affiliate_sale', '🛒 Penjualan dari Kode Promo!', 'Anda mendapat komisi Rp 1000 dari penjualan', 1, '2026-01-13 16:13:21'),
(140, 21, 'affiliate_sale', '🛒 Penjualan dari Kode Promo!', 'Anda mendapat komisi Rp 5000 dari penjualan', 1, '2026-01-13 16:13:21'),
(141, 8, 'purchase_success', '✅ Pembayaran Berhasil!', 'Pembelian 2 item berhasil. Silakan akses konten Anda.', 1, '2026-01-13 16:13:21'),
(142, 21, 'affiliate_sale', '🛒 Penjualan dari Kode Promo!', 'Anda mendapat komisi Rp 1000 dari penjualan', 1, '2026-01-13 16:25:58'),
(143, 21, 'affiliate_sale', '🛒 Penjualan dari Kode Promo!', 'Anda mendapat komisi Rp 5000 dari penjualan', 1, '2026-01-13 16:25:58'),
(144, 8, 'purchase_success', '✅ Pembayaran Berhasil!', 'Pembelian 2 item berhasil. Silakan akses konten Anda.', 1, '2026-01-13 16:25:58'),
(145, 11, 'withdrawal_request', '💰 Permintaan Penarikan Baru', 'Organisasi \"Pemuda IT lembangs\" mengajukan penarikan Rp 50000', 1, '2026-01-13 17:02:56'),
(146, 6, 'withdrawal_approved', '✅ Penarikan Disetujui', 'Penarikan sebesar Rp 50000 telah disetujui dan sedang diproses.', 0, '2026-01-13 17:03:55'),
(147, 11, 'withdrawal_request', '💰 Permintaan Penarikan Affiliate', 'Affiliate \"affiliate\" mengajukan penarikan Rp 20000', 1, '2026-01-13 17:17:38'),
(148, 21, 'withdrawal_rejected', '❌ Penarikan Ditolak', 'Penarikan sebesar Rp 20000 ditolak. Alasan: tunggu ya ulang', 1, '2026-01-13 17:18:10'),
(149, 11, 'withdrawal_request', '💰 Permintaan Penarikan Affiliate', 'Affiliate \"affiliate\" mengajukan penarikan Rp 50000', 1, '2026-01-13 17:28:01'),
(150, 21, 'withdrawal_approved', '✅ Penarikan Disetujui', 'Penarikan sebesar Rp 50000 telah disetujui dan sedang diproses.', 1, '2026-01-13 17:28:29'),
(151, 11, 'new_application', '📝 Pengajuan Organisasi Baru!', 'Ulbi Academy mendaftar sebagai organisasi \"Ulbi academy\"', 1, '2026-01-13 17:44:14'),
(152, 11, 'new_application', '📝 Pengajuan Organisasi Baru!', 'ulbi mendaftar sebagai organisasi \"ulbi\"', 1, '2026-01-13 17:50:36'),
(153, 11, 'new_application', '📝 Pengajuan Organisasi Baru!', 'Ulbi mendaftar sebagai organisasi \"ULBI ACADEMY\"', 1, '2026-01-14 10:46:15'),
(154, 25, 'application_approved', '🎉 Pengajuan Disetujui!', 'Selamat! Pengajuan organisasi \"ULBI ACADEMY\" telah disetujui. Anda sekarang dapat membuat event.', 0, '2026-01-14 11:06:23'),
(155, 21, 'affiliate_updated', '📝 Kode Affiliate Diperbarui', 'Kode affiliate untuk event \"Belajar Golang\" telah diperbarui menjadi: AFFILIATE1', 1, '2026-01-14 13:51:39'),
(156, 21, 'affiliate_status_changed', '🔔 Status Affiliate Berubah', 'Kode affiliate untuk event \"Belajar Golang\" telah dinonaktifkan', 1, '2026-01-14 13:51:46'),
(157, 21, 'affiliate_status_changed', '🔔 Status Affiliate Berubah', 'Kode affiliate untuk event \"Belajar Golang\" telah diaktifkan kembali', 1, '2026-01-14 13:51:48'),
(158, 17, 'affiliate_removed', '🚫 Kemitraan Affiliate Dihentikan', 'Kemitraan affiliate untuk event \"Belajar Golang\" telah dihentikan oleh organisasi', 0, '2026-01-14 13:52:02'),
(159, 21, 'affiliate_status_changed', '🔔 Status Affiliate Berubah', 'Kode affiliate untuk event \"Belajar Golang\" telah dinonaktifkan', 1, '2026-01-14 13:52:13'),
(160, 21, 'affiliate_status_changed', '🔔 Status Affiliate Berubah', 'Kode affiliate untuk event \"Belajar Golang\" telah aktif kembali', 1, '2026-01-14 14:15:40'),
(161, 21, 'affiliate_updated', '📝 Kode Affiliate Diperbarui', 'Kode affiliate untuk event \"Belajar Golang\" telah diperbarui menjadi: AFFILIATE1', 1, '2026-01-14 14:16:00'),
(162, 21, 'affiliate_sale', '🛒 Penjualan dari Kode Promo!', 'Anda mendapat komisi Rp 5000 dari penjualan', 1, '2026-01-14 14:16:31'),
(163, 6, 'purchase_success', '✅ Pembayaran Berhasil!', 'Pembelian 1 item berhasil. Silakan akses konten Anda.', 0, '2026-01-14 14:16:31'),
(164, 21, 'affiliate_sale', '🛒 Penjualan dari Kode Promo!', 'Anda mendapat komisi Rp 1000 dari penjualan', 1, '2026-01-14 14:17:44'),
(165, 21, 'affiliate_sale', '🛒 Penjualan dari Kode Promo!', 'Anda mendapat komisi Rp 5000 dari penjualan', 1, '2026-01-14 14:17:44'),
(166, 7, 'purchase_success', '✅ Pembayaran Berhasil!', 'Pembelian 2 item berhasil. Silakan akses konten Anda.', 0, '2026-01-14 14:17:44'),
(167, 25, 'profile_updated', '👤 Profil Diperbarui', 'Admin telah memperbarui informasi profil Anda. Alasan: biar bagus', 0, '2026-01-17 11:04:52'),
(168, 11, 'new_report', '📢 Laporan Baru', 'Ada laporan baru: tes tes', 0, '2026-01-17 11:34:23');

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
  `social_link` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_official` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `organizations`
--

INSERT INTO `organizations` (`id`, `owner_user_id`, `name`, `description`, `category`, `logo_url`, `email`, `phone`, `website`, `social_link`, `address`, `created_at`, `is_official`) VALUES
(3, 6, 'Pemuda IT lembangs', 'latihan ngoding pemula', 'Teknologi', 'uploads/organization/org_logo_3_1768929519178205900.jpeg', 'Rakaacademy@gmail.com', '084531065649', 'http://localhost:5173/dashboard', 'http://localhost:5173/dashboard', 'lembang', '2025-11-30 11:54:47', 0),
(8, 3, 'WEBBINAR OFFICIAL ', 'Platform official events & affiliate courses', 'Platform', 'uploads\\logos\\official_1767092828229877500.jpg', 'webbinar@gmail.com', NULL, NULL, NULL, NULL, '2025-12-28 14:10:25', 1),
(36, 25, 'Ulbi Academy', 'belajar bersama ulbi', 'Pendidikan', 'uploads/organization/org_logo_36_1768388903345635900.png', 'ulbiacademy@gmail.com', '083516516535', 'https://ulbi.ac.id/', 'https://www.instagram.com/ulbi.official/', 'Jalan Sarijadi', '2026-01-14 11:06:23', 0);

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
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `bank_name` varchar(100) DEFAULT NULL,
  `bank_account` varchar(100) DEFAULT NULL,
  `bank_account_name` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `organization_applications`
--

INSERT INTO `organization_applications` (`id`, `user_id`, `org_name`, `org_description`, `org_category`, `org_logo_url`, `org_email`, `org_phone`, `org_website`, `reason`, `social_media`, `status`, `reviewed_by`, `reviewed_at`, `review_note`, `submitted_at`, `bank_name`, `bank_account`, `bank_account_name`) VALUES
(8, 25, 'ULBI ACADEMY', 'belajar bersama ulbi', 'Pendidikan', NULL, NULL, '08448651651', NULL, 'Registrasi langsung sebagai organisasi', NULL, 'APPROVED', 11, '2026-01-14 04:06:23', 'okei', '2026-01-14 10:46:14', 'BCA', '13234235', 'ULBI');

-- --------------------------------------------------------

--
-- Table structure for table `organization_balances`
--

CREATE TABLE `organization_balances` (
  `id` bigint NOT NULL,
  `organization_id` bigint NOT NULL,
  `balance` decimal(15,2) DEFAULT '0.00',
  `total_earned` decimal(15,2) DEFAULT '0.00',
  `total_withdrawn` decimal(15,2) DEFAULT '0.00',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `organization_balances`
--

INSERT INTO `organization_balances` (`id`, `organization_id`, `balance`, `total_earned`, `total_withdrawn`, `updated_at`) VALUES
(21, 3, '103000.00', '153000.00', '50000.00', '2026-01-14 14:17:43');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`id`, `user_id`, `token`, `expires_at`, `used`, `created_at`) VALUES
(2, 20, '514714', '2026-01-08 14:31:08', 0, '2026-01-08 21:16:08');

-- --------------------------------------------------------

--
-- Table structure for table `purchases`
--

CREATE TABLE `purchases` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `session_id` bigint NOT NULL,
  `price_paid` double NOT NULL,
  `purchased_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('PENDING','PAID','FAILED') DEFAULT 'PAID',
  `order_id` varchar(100) DEFAULT NULL,
  `snap_token` varchar(255) DEFAULT NULL,
  `midtrans_order_id` varchar(255) DEFAULT NULL,
  `affiliate_code` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `purchases`
--

INSERT INTO `purchases` (`id`, `user_id`, `session_id`, `price_paid`, `purchased_at`, `status`, `order_id`, `snap_token`, `midtrans_order_id`, `affiliate_code`) VALUES
(114, 8, 23, 10000, '2026-01-13 23:25:43', 'PAID', 'CART-1768321543-3-8', '8747e214-805d-4ecb-934c-bb4050332c28', 'CART-1768321543-3-8-AFF-AFFILIATE1', 'AFFILIATE1'),
(115, 8, 24, 50000, '2026-01-13 23:25:43', 'PAID', 'CART-1768321543-3-8', '8747e214-805d-4ecb-934c-bb4050332c28', 'CART-1768321543-3-8-AFF-AFFILIATE1', 'AFFILIATE1'),
(116, 6, 24, 50000, '2026-01-14 21:16:08', 'PAID', 'CART-1768400168-1-6', '6998518b-e14b-4101-abda-3b51a4935b89', 'CART-1768400168-1-6-AFF-AFFILIATE1', 'AFFILIATE1'),
(117, 7, 23, 10000, '2026-01-14 21:17:28', 'PAID', 'CART-1768400248-4-7', 'fb9d8b1f-854e-442d-882d-e3375939b95c', 'CART-1768400248-4-7-AFF-AFFILIATE1', 'AFFILIATE1'),
(118, 7, 24, 50000, '2026-01-14 21:17:28', 'PAID', 'CART-1768400248-4-7', 'fb9d8b1f-854e-442d-882d-e3375939b95c', 'CART-1768400248-4-7-AFF-AFFILIATE1', 'AFFILIATE1');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_attempts`
--

CREATE TABLE `quiz_attempts` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `quiz_id` bigint NOT NULL,
  `score_percent` decimal(5,2) NOT NULL,
  `answers` json DEFAULT NULL,
  `passed` tinyint(1) DEFAULT '0',
  `attempted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `quiz_attempts`
--

INSERT INTO `quiz_attempts` (`id`, `user_id`, `quiz_id`, `score_percent`, `answers`, `passed`, `attempted_at`) VALUES
(10, 8, 7, '100.00', '{\"14\": \"A\"}', 1, '2026-01-20 18:42:04');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
--

CREATE TABLE `quiz_questions` (
  `id` bigint NOT NULL,
  `quiz_id` bigint NOT NULL,
  `question_text` text NOT NULL,
  `option_a` varchar(500) NOT NULL,
  `option_b` varchar(500) NOT NULL,
  `option_c` varchar(500) DEFAULT NULL,
  `option_d` varchar(500) DEFAULT NULL,
  `correct_option` char(1) NOT NULL,
  `order_index` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `quiz_questions`
--

INSERT INTO `quiz_questions` (`id`, `quiz_id`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option`, `order_index`) VALUES
(14, 7, 'apa itu golang ', 'bahasa pemrograman', 'makanan', 'minuman', 'mobil', 'A', 1);

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `category` varchar(100) DEFAULT 'general',
  `subject` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `status` enum('pending','in_progress','resolved','rejected') DEFAULT 'pending',
  `admin_notes` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `user_id`, `category`, `subject`, `description`, `photo_url`, `status`, `admin_notes`, `created_at`, `updated_at`) VALUES
(5, 8, 'BUG', 'tolooong', 'anjay', 'uploads\\reports\\report_1768227095744566500_0a9f5b2c.jpeg', 'resolved', 'Masalah sudah diselesaikan', '2026-01-12 21:11:35', '2026-01-14 20:38:30'),
(6, 8, 'BUG', 'tes tes', 'sadasdad', '', 'resolved', 'Masalah sudah diselesaikan', '2026-01-17 18:34:23', '2026-01-17 18:41:25');

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
(4, 'AFFILIATE'),
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
(23, 23, 'percobaan', 'oengenalan', 10000, 1, '2026-01-11 12:02:36', 'PUBLISHED', NULL),
(24, 23, 'sesi 2', 'sada', 50000, 2, '2026-01-11 14:23:54', 'PUBLISHED', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `session_files`
--

CREATE TABLE `session_files` (
  `id` bigint NOT NULL,
  `session_id` bigint NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `file_url` varchar(255) NOT NULL,
  `size_bytes` bigint DEFAULT '0',
  `order_index` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `session_quizzes`
--

CREATE TABLE `session_quizzes` (
  `id` bigint NOT NULL,
  `session_id` bigint NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `is_enabled` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `session_quizzes`
--

INSERT INTO `session_quizzes` (`id`, `session_id`, `title`, `is_enabled`, `created_at`) VALUES
(7, 23, 'kuis 1', 1, '2026-01-20 18:40:12');

-- --------------------------------------------------------

--
-- Table structure for table `session_videos`
--

CREATE TABLE `session_videos` (
  `id` bigint NOT NULL,
  `session_id` bigint NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `video_url` varchar(255) NOT NULL,
  `size_bytes` bigint DEFAULT '0',
  `order_index` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `session_videos`
--

INSERT INTO `session_videos` (`id`, `session_id`, `title`, `description`, `video_url`, `size_bytes`, `order_index`, `created_at`) VALUES
(32, 23, 'pengenalan golang', 'belajar dasar dan pengenalan\n', 'uploads/videos/session_23_1768134611.mp4', 1115092, 1, '2026-01-11 19:30:11'),
(33, 24, 'materi 1', 'pembelajaran 1', 'uploads/videos/session_24_1768141449.mp4', 639454, 1, '2026-01-11 21:24:09');

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
  `username` varchar(60) DEFAULT NULL,
  `bio` varchar(500) DEFAULT NULL,
  `admin_level` int DEFAULT '0',
  `gender` varchar(20) DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `address` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `created_at`, `phone`, `profile_img`, `username`, `bio`, `admin_level`, `gender`, `birthdate`, `address`) VALUES
(6, 'ananda raka academy', 'rakaacademy@gmail.com', '$2a$14$mxwRh9bgvTmhVwRxxtY4hOT/GSmltg6BimFEVNdMucW3un8Q/RGnu', '2025-11-30 11:51:25', '065165235498', 'uploads/profile/user_6_1766404223.png', 'raka', 'admin besar', 0, 'Laki-laki', '2003-07-16', 'bandung banget, kota subang, desa los angeles'),
(7, 'admin kecil', 'user@gmail.com', '$2a$14$y6D8jQm5mCi.5BVcCnpfauWBCpgu/j6fgcbUFkQP4N2aB.SKpOecu', '2025-12-06 11:23:53', '081354984231', '', 'AWDSADWAd', '', 0, NULL, NULL, NULL),
(8, 'customer 1', 'beli@gmail.com', '$2a$14$EU8Vx9/FNRUaccG8Z7fBy.GGM6x7uTdU0fCoVfaPWKEnDSPC2TA0y', '2025-12-09 15:51:08', '055521315651', 'uploads/profile/user_8_1766410150.png', 'juragan', 'sadsad', 0, 'Laki-laki', '2025-12-28', 'aSas'),
(11, 'admin ganteng akun pertama', 'admin@gmail.com', '$2a$14$QK8pHMK06iVP2an007KitOYMiIETFcDkPRslfIwKHq2FOaZzTJsvS', '2025-12-21 10:37:04', '0813134746651', 'uploads/profile/user_11_1766402298.png', 'SUPERRRRR Admin ', 'aman banget gweh admin', 1, 'Laki-laki', '2005-07-30', 'lembang'),
(12, 'academy Ulbi baik', 'Ulbiacademy@gmail.com', '$2a$14$aBeE8vqPO/a3Kxy7EI2oa.0Kd.ESXphoOon.TCxFCFQQkpGynaJlW', '2025-12-21 10:51:43', '08165468796651', NULL, NULL, 'asdasmdnasm,', 0, NULL, NULL, NULL),
(13, 'admin junior', 'admin2@gmail.com', '$2a$10$Du0k5Qu1Wlh0pIElzbJbTOP77F.DTHwo3nY.ZwEvZS1RiS5E/oJ.u', '2025-12-24 12:17:03', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL),
(15, 'Andi andarsyah jelek', 'bengkelacademy@gmail.com', '$2a$14$XdBxGokAI64MLlORL4cH7O8PTkJpRjqI/b9IKWm/jrG/2ebhTY/Pe', '2025-12-26 08:56:38', '084316516561', 'uploads/profile/user_15_1766741449.jpg', 'andi bengkel', 'sarjana mesin dari unversitas gajah duduk', 0, 'Laki-laki', '2025-12-26', 'gatau dimana sih aowkoakwoko'),
(17, 'budi afiliate', 'budi@gmail.com', '$2a$14$BCmYuc8FK6ZkNXXDbTskQ.XlEj5otZ0t76NtNozVLYPXtaZ0KIh0.', '2025-12-29 10:11:27', '084316516561', 'uploads/profile/user_17_1767003740.png', 'budi ganteng', 'bismillah affiliate beres', 0, 'Laki-laki', '2001-06-13', 'jakarta '),
(18, 'aku baru', 'baru@gmail.com', '$2a$14$W3BvwkhRe7utGMgNkZ0oPOVjpDFtrODYm8ifyD6n.GVTePGmfOkCO', '2026-01-01 09:52:41', '081354984231', 'uploads/profile/user_18_1767261487.png', 'anak baru', 'anak baru yang gantentg asda anjay\n', 0, 'Laki-laki', '2005-05-23', 'rumah asdasd anjay'),
(19, 'wahyuu', 'wahyu@gmail.com', '$2a$14$wAVPuzdVIrDBLD34ijlSAu/ssv7n1lDK5j1aCiYyFMbT56MM.iO0e', '2026-01-01 12:11:56', '', NULL, NULL, '', 0, NULL, NULL, NULL),
(20, 'reset pass', 'captainhoof3005@gmail.com', '$2a$10$3s.N//GAhZS1VecjvIqEAON23Sz5/pQ2nfCrl7UM1Jhb5p5.9Dmci', '2026-01-08 14:01:27', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL),
(21, 'affiliate', 'affiliate@gmail.com', '$2a$14$FKmEBzdQ/m/p.T891ehRS.77GF.lFLHV2GS5WopZCNTehVjuKhTlK', '2026-01-13 15:28:30', '085432103564', '', 'affiliate baru', 'asdsadasd', 0, 'Laki-laki', '2002-01-25', 'sadasdgf'),
(22, 'user2', 'user2@gmail.com', '$2a$14$iYGzCSDJbxDkbfUuGPPeN.7dlZp4nXtsBqQa0.4N6JEHh82wGqWVO', '2026-01-13 15:56:41', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL),
(25, 'Ulbi academy', 'ulbiacademy2@gmail.com', '$2a$14$.UDL1EOthIstH9wc/isqROmBG9ULwY7l71Mc88e2rxUizNl29FrEm', '2026-01-14 10:46:14', '0813511654987', NULL, NULL, '', 0, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_certificates`
--

CREATE TABLE `user_certificates` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `event_id` bigint NOT NULL,
  `total_score_percent` decimal(5,2) NOT NULL,
  `certificate_code` varchar(50) DEFAULT NULL,
  `issued_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_certificates`
--

INSERT INTO `user_certificates` (`id`, `user_id`, `event_id`, `total_score_percent`, `certificate_code`, `issued_at`) VALUES
(3, 8, 23, '100.00', 'CERT-2ad07a3c30df5cea', '2026-01-20 18:42:07');

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
(7, 1),
(8, 1),
(12, 1),
(13, 1),
(15, 1),
(17, 1),
(18, 1),
(19, 1),
(20, 1),
(21, 1),
(22, 1),
(6, 2),
(25, 2),
(11, 3),
(17, 4),
(21, 4);

-- --------------------------------------------------------

--
-- Table structure for table `withdrawal_requests`
--

CREATE TABLE `withdrawal_requests` (
  `id` bigint NOT NULL,
  `requester_type` enum('ORGANIZATION','AFFILIATE') NOT NULL,
  `requester_id` bigint NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `bank_name` varchar(50) NOT NULL,
  `bank_account` varchar(50) NOT NULL,
  `bank_account_name` varchar(100) NOT NULL,
  `notes` text,
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `admin_notes` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `processed_at` datetime DEFAULT NULL,
  `processed_by` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `withdrawal_requests`
--

INSERT INTO `withdrawal_requests` (`id`, `requester_type`, `requester_id`, `amount`, `bank_name`, `bank_account`, `bank_account_name`, `notes`, `status`, `admin_notes`, `created_at`, `processed_at`, `processed_by`) VALUES
(1, 'ORGANIZATION', 3, '50000.00', 'BCA', '2135465321321', 'pemuda IT', 'asdasdasd', 'APPROVED', 'sudah dikirim yah', '2026-01-14 00:02:55', '2026-01-14 00:03:54', 11),
(2, 'AFFILIATE', 21, '20000.00', 'BCA', '1231423', 'affiliate', 'dafrtgeAW', 'REJECTED', 'tunggu ya ulang', '2026-01-14 00:17:37', '2026-01-14 00:18:10', 11),
(3, 'AFFILIATE', 21, '50000.00', 'BCA', '1234123124', 'Affiliate', 'wadadidaw', 'APPROVED', 'okeiii sudah ya', '2026-01-14 00:28:01', '2026-01-14 00:28:28', 11);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ad_banners`
--
ALTER TABLE `ad_banners`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `affiliate_applications`
--
ALTER TABLE `affiliate_applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_affiliate_applications_user` (`user_id`);

--
-- Indexes for table `affiliate_balances`
--
ALTER TABLE `affiliate_balances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `affiliate_partnerships`
--
ALTER TABLE `affiliate_partnerships`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_affiliate_event` (`user_id`,`event_id`),
  ADD UNIQUE KEY `uk_unique_code` (`unique_code`),
  ADD KEY `fk_ap_user` (`user_id`),
  ADD KEY `fk_ap_event` (`event_id`),
  ADD KEY `fk_ap_org` (`organization_id`);

--
-- Indexes for table `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_cart_user` (`user_id`);

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ci_cart` (`cart_id`),
  ADD KEY `fk_ci_session` (`session_id`),
  ADD KEY `fk_ci_event` (`event_id`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_events_org` (`organization_id`),
  ADD KEY `fk_events_affiliate` (`affiliate_submission_id`);

--
-- Indexes for table `event_certificates`
--
ALTER TABLE `event_certificates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `event_id` (`event_id`);

--
-- Indexes for table `featured_events`
--
ALTER TABLE `featured_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `event_id` (`event_id`);

--
-- Indexes for table `financial_transactions`
--
ALTER TABLE `financial_transactions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `organization_balances`
--
ALTER TABLE `organization_balances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `organization_id` (`organization_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`session_id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `idx_purchases_affiliate_code` (`affiliate_code`);

--
-- Indexes for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `quiz_id` (`quiz_id`);

--
-- Indexes for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `quiz_id` (`quiz_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

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
-- Indexes for table `session_quizzes`
--
ALTER TABLE `session_quizzes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_id` (`session_id`);

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
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `user_certificates`
--
ALTER TABLE `user_certificates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_cert` (`user_id`,`event_id`),
  ADD UNIQUE KEY `certificate_code` (`certificate_code`),
  ADD KEY `event_id` (`event_id`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `withdrawal_requests`
--
ALTER TABLE `withdrawal_requests`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ad_banners`
--
ALTER TABLE `ad_banners`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `affiliate_applications`
--
ALTER TABLE `affiliate_applications`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `affiliate_balances`
--
ALTER TABLE `affiliate_balances`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `affiliate_partnerships`
--
ALTER TABLE `affiliate_partnerships`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `carts`
--
ALTER TABLE `carts`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `event_certificates`
--
ALTER TABLE `event_certificates`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `featured_events`
--
ALTER TABLE `featured_events`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `financial_transactions`
--
ALTER TABLE `financial_transactions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=169;

--
-- AUTO_INCREMENT for table `organizations`
--
ALTER TABLE `organizations`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `organization_applications`
--
ALTER TABLE `organization_applications`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `organization_balances`
--
ALTER TABLE `organization_balances`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `purchases`
--
ALTER TABLE `purchases`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=119;

--
-- AUTO_INCREMENT for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `session_files`
--
ALTER TABLE `session_files`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `session_quizzes`
--
ALTER TABLE `session_quizzes`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `session_videos`
--
ALTER TABLE `session_videos`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `user_certificates`
--
ALTER TABLE `user_certificates`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `withdrawal_requests`
--
ALTER TABLE `withdrawal_requests`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `affiliate_applications`
--
ALTER TABLE `affiliate_applications`
  ADD CONSTRAINT `fk_affiliate_applications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `affiliate_balances`
--
ALTER TABLE `affiliate_balances`
  ADD CONSTRAINT `affiliate_balances_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `affiliate_partnerships`
--
ALTER TABLE `affiliate_partnerships`
  ADD CONSTRAINT `fk_ap_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ap_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ap_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_ci_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ci_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ci_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `fk_events_affiliate` FOREIGN KEY (`affiliate_submission_id`) REFERENCES `affiliate_submissions` (`id`),
  ADD CONSTRAINT `fk_events_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`);

--
-- Constraints for table `event_certificates`
--
ALTER TABLE `event_certificates`
  ADD CONSTRAINT `event_certificates_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `featured_events`
--
ALTER TABLE `featured_events`
  ADD CONSTRAINT `featured_events_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `organization_balances`
--
ALTER TABLE `organization_balances`
  ADD CONSTRAINT `organization_balances_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `purchases`
--
ALTER TABLE `purchases`
  ADD CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `purchases_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`);

--
-- Constraints for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD CONSTRAINT `quiz_attempts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quiz_attempts_ibfk_2` FOREIGN KEY (`quiz_id`) REFERENCES `session_quizzes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD CONSTRAINT `quiz_questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `session_quizzes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

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
-- Constraints for table `session_quizzes`
--
ALTER TABLE `session_quizzes`
  ADD CONSTRAINT `session_quizzes_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `session_videos`
--
ALTER TABLE `session_videos`
  ADD CONSTRAINT `fk_session_videos_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`);

--
-- Constraints for table `user_certificates`
--
ALTER TABLE `user_certificates`
  ADD CONSTRAINT `user_certificates_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_certificates_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE;

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
