-- Migration: convert RoomCategory from enum to table
-- Run against: streamyolo_dev
-- Safe to run multiple times (IF NOT EXISTS guards)

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Create the new RoomCategory table
CREATE TABLE IF NOT EXISTS `RoomCategory` (
  `id`        VARCHAR(191) NOT NULL,
  `slug`      VARCHAR(191) NOT NULL,
  `label`     VARCHAR(191) NOT NULL,
  `sortOrder` INT          NOT NULL DEFAULT 0,
  `isActive`  TINYINT(1)   NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `RoomCategory_slug_key` (`slug`),
  INDEX  `RoomCategory_isActive_sortOrder_idx` (`isActive`, `sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Seed the four standard categories (idempotent)
INSERT IGNORE INTO `RoomCategory` (`id`, `slug`, `label`, `sortOrder`, `isActive`, `createdAt`)
VALUES
  (CONCAT('cat', SUBSTRING(MD5(RAND()), 1, 24)), 'entertainment',    'Entertainment',    0, 1, NOW()),
  (CONCAT('cat', SUBSTRING(MD5(RAND()), 1, 24)), 'music',  'Music',  1, 1, NOW()),
  (CONCAT('cat', SUBSTRING(MD5(RAND()), 1, 24)), 'education', 'Education', 2, 1, NOW()),
  (CONCAT('cat', SUBSTRING(MD5(RAND()), 1, 24)), 'business',   'Business',   3, 1, NOW());

-- 3. Convert Room.category from ENUM to VARCHAR and lowercase existing values
ALTER TABLE `Room`
  MODIFY COLUMN `category` VARCHAR(191) NULL;

UPDATE `Room` SET `category` = LOWER(`category`) WHERE `category` IS NOT NULL;

-- 4. Convert CreatorProfile.defaultRoomCategory from ENUM to VARCHAR and lowercase
ALTER TABLE `CreatorProfile`
  MODIFY COLUMN `defaultRoomCategory` VARCHAR(191) NULL;

UPDATE `CreatorProfile` SET `defaultRoomCategory` = LOWER(`defaultRoomCategory`) WHERE `defaultRoomCategory` IS NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;

-- Done. Verify:
SELECT 'RoomCategory rows:' AS info, COUNT(*) AS n FROM `RoomCategory`
UNION ALL
SELECT 'Room.category sample:', COUNT(*) FROM `Room` WHERE `category` IS NOT NULL;
