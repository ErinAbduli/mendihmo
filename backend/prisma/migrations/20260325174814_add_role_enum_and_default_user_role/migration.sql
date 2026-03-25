/*
  Warnings:

  - You are about to alter the column `normalized_name` on the `role` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `role` MODIFY `normalized_name` ENUM('USER', 'MODERATOR', 'ADMIN') NOT NULL DEFAULT 'USER';
