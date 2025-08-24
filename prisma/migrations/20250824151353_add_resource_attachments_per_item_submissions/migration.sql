/*
  Warnings:

  - The values [PDF,LINK,TEXT,FILE] on the enum `Resource_type` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[resourceAttachmentId,enrollmentId,studentId]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Resource` MODIFY `type` ENUM('VIDEO', 'AUDIO_EXERCISE') NOT NULL;

-- AlterTable
ALTER TABLE `Submission` ADD COLUMN `resourceAttachmentId` INTEGER NULL;

-- CreateTable
CREATE TABLE `ResourceAttachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `resourceId` INTEGER NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ResourceAttachment_resourceId_idx`(`resourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Submission_resourceAttachmentId_idx` ON `Submission`(`resourceAttachmentId`);

-- CreateIndex
CREATE UNIQUE INDEX `Submission_resourceAttachmentId_enrollmentId_studentId_key` ON `Submission`(`resourceAttachmentId`, `enrollmentId`, `studentId`);

-- AddForeignKey
ALTER TABLE `ResourceAttachment` ADD CONSTRAINT `ResourceAttachment_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_resourceAttachmentId_fkey` FOREIGN KEY (`resourceAttachmentId`) REFERENCES `ResourceAttachment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
