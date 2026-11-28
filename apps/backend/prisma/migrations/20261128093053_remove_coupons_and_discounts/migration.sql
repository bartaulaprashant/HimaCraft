/*
  Warnings:

  - You are about to drop the column `couponId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `Coupon` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CouponUsage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CouponUsage" DROP CONSTRAINT "CouponUsage_couponId_fkey";

-- DropForeignKey
ALTER TABLE "CouponUsage" DROP CONSTRAINT "CouponUsage_userId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_couponId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "couponId",
DROP COLUMN "discount";

-- DropTable
DROP TABLE "Coupon";

-- DropTable
DROP TABLE "CouponUsage";

-- DropEnum
DROP TYPE "DiscountType";
