/*
  Warnings:

  - You are about to drop the column `photoUrl` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `report` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "photoUrl",
DROP COLUMN "report";

-- CreateTable
CREATE TABLE "TaskEntry" (
    "id" SERIAL NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" INTEGER NOT NULL,
    "taskId" INTEGER NOT NULL,
    "photos" TEXT[],

    CONSTRAINT "TaskEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaskEntry" ADD CONSTRAINT "TaskEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEntry" ADD CONSTRAINT "TaskEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
