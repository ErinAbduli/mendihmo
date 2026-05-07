-- Add soft-disable support for categories
ALTER TABLE `Category`
ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;
