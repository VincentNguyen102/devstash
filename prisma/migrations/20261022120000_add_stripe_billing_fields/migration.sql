-- AlterTable
ALTER TABLE "User"
    ADD COLUMN     "stripePriceId" TEXT,
    ADD COLUMN     "stripeSubscriptionStatus" TEXT,
    ADD COLUMN     "stripeCurrentPeriodEnd" TIMESTAMP(3),
    ADD COLUMN     "stripeCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
