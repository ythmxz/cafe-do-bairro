import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { type Prisma, PrismaClient } from "../generated/client.js";

const adapter = new PrismaPg({
  connectionString:
    process.env.STORAGE_DATABASE_URL ?? process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });

export type Transaction = Prisma.TransactionClient;
