/*
  Warnings:

  - Added the required column `report` to the `TaskEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TaskEntry" ADD COLUMN     "report" TEXT NOT NULL;
