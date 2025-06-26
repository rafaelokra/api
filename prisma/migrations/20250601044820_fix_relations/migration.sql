/*
  Warnings:

  - You are about to drop the `Autorizado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Gasto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Receita` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `telefone` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Gasto" DROP CONSTRAINT "Gasto_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Receita" DROP CONSTRAINT "Receita_usuarioId_fkey";

-- DropTable
DROP TABLE "Autorizado";

-- DropTable
DROP TABLE "Gasto";

-- DropTable
DROP TABLE "Receita";

-- DropTable
DROP TABLE "Usuario";

-- DropTable
DROP TABLE "telefone";

-- CreateTable
CREATE TABLE "numeros" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "numeros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autorizados" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autorizados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "chatId" TEXT,
    "senhaHash" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" SERIAL NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "categoria" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receitas" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "receitas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "numeros_numero_key" ON "numeros"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "autorizados_numero_key" ON "autorizados"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_telefone_key" ON "usuarios"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_chatId_key" ON "usuarios"("chatId");

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
