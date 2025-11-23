-- DropForeignKey
ALTER TABLE "TaskEntry" DROP CONSTRAINT "TaskEntry_taskId_fkey";

-- AddForeignKey
ALTER TABLE "TaskEntry" ADD CONSTRAINT "TaskEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
