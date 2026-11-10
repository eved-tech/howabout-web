-- CreateTable
CREATE TABLE "BrandOwner" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brandId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BrandOwner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrandOwner_brandId_userId_key" ON "BrandOwner"("brandId", "userId");

-- AddForeignKey
ALTER TABLE "BrandOwner" ADD CONSTRAINT "BrandOwner_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandOwner" ADD CONSTRAINT "BrandOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
