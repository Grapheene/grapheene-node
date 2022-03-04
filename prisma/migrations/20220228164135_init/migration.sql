-- CreateTable
CREATE TABLE "KeyStore" (
    "uuid" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "data" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "KeyStore_uuid_key" ON "KeyStore"("uuid");
