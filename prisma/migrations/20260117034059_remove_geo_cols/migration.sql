/*
  Warnings:

  - You are about to drop the column `startLat` on the `Ride` table. All the data in the column will be lost.
  - You are about to drop the column `startLng` on the `Ride` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ride" DROP COLUMN "startLat",
DROP COLUMN "startLng";
