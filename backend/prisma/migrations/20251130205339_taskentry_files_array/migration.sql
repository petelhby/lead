-- AlterTable
ALTER TABLE "TaskEntry" ADD COLUMN     "files" TEXT[] DEFAULT ARRAY[]::TEXT[];
