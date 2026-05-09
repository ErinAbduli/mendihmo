-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `stripeSessionId` VARCHAR(191) NULL,
    ADD UNIQUE INDEX `transaction_stripeSessionId_key`(`stripeSessionId`);