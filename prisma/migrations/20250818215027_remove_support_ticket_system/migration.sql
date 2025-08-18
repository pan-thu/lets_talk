/*
  Warnings:

  - You are about to drop the `SupportTicket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TicketResponse` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `SupportTicket` DROP FOREIGN KEY `SupportTicket_assigneeId_fkey`;

-- DropForeignKey
ALTER TABLE `SupportTicket` DROP FOREIGN KEY `SupportTicket_submitterId_fkey`;

-- DropForeignKey
ALTER TABLE `TicketResponse` DROP FOREIGN KEY `TicketResponse_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `TicketResponse` DROP FOREIGN KEY `TicketResponse_ticketId_fkey`;

-- DropTable
DROP TABLE `SupportTicket`;

-- DropTable
DROP TABLE `TicketResponse`;
