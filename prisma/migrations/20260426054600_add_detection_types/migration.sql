-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "detect_devtools" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "detect_page_leave" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "detect_paste" BOOLEAN NOT NULL DEFAULT false;
