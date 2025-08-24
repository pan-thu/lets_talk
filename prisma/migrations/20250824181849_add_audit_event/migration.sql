-- CreateTable
CREATE TABLE `AuditEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('LIVE_SCHEDULED', 'LIVE_UPDATED', 'LIVE_CANCELLED', 'RECORDING_UPLOADED', 'EXERCISE_ADDED', 'SUBMISSION_GRADED', 'ENROLLMENT_ACTIVATED') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `courseId` INTEGER NULL,
    `actorUserId` VARCHAR(191) NULL,

    INDEX `AuditEvent_courseId_idx`(`courseId`),
    INDEX `AuditEvent_occurredAt_idx`(`occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AuditEvent` ADD CONSTRAINT `AuditEvent_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditEvent` ADD CONSTRAINT `AuditEvent_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
