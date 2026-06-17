-- AlterEnum
ALTER TYPE "SchoolStatus" ADD VALUE 'PAUSED';

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "affiliatedTo" TEXT,
ADD COLUMN     "altPhone" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "panNo" TEXT,
ADD COLUMN     "principalEmail" TEXT,
ADD COLUMN     "principalPhone" TEXT,
ADD COLUMN     "registrationNo" TEXT,
ADD COLUMN     "totalCapacity" INTEGER,
ALTER COLUMN "status" SET DEFAULT 'TRIAL';
