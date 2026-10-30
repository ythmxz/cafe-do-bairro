-- CreateEnum
CREATE TYPE "Status" AS ENUM ('RECEBIDA', 'PREPARO', 'ENTREGUE');

-- CreateTable
CREATE TABLE "encomendas" (
    "id" SERIAL NOT NULL,
    "cliente" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "produto" TEXT NOT NULL,
    "dataEntrega" DATE NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'RECEBIDA',
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encomendas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "encomendas_dataEntrega_idx" ON "encomendas"("dataEntrega");
