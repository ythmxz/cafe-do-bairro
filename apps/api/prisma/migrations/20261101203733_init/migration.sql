-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('RECEBIDA', 'PREPARO', 'ENTREGUE');

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "customer" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "delivery_date" DATE NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'RECEBIDA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orders_delivery_date_idx" ON "orders"("delivery_date");
