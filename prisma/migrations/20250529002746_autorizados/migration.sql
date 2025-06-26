-- CreateTable
CREATE TABLE "Autorizado" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Autorizado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Autorizado_numero_key" ON "Autorizado"("numero");
INSERT INTO autorizados (numero) VALUES ('557191116021');