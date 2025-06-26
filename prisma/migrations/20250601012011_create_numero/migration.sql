/*
  Warnings:

  - You are about to drop the column `criadoEm` on the `Autorizado` table. All the data in the column will be lost.
  - You are about to drop the `Numero` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Autorizado` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Autorizado" DROP COLUMN "criadoEm",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Numero";

-- CreateTable
CREATE TABLE "telefone" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telefone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telefone_numero_key" ON "telefone"("numero");
