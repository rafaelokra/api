-- CreateTable
CREATE TABLE "Numero" (
    "id" SERIAL NOT NULL,
    "telefone" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Numero_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Numero_telefone_key" ON "Numero"("telefone");
