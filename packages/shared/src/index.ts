import { z } from "zod";

export const ORDER_STATUS = ["RECEBIDA", "PREPARO", "ENTREGUE"] as const;
export const DAILY_LIMIT: number = 5;

const phoneSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .pipe(
    z
      .string()
      .regex(
        /^\d{10,11}$/,
        "Utilize o formato DDD + Número, ex.: (73) 91234-5678",
      ),
  );

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Utilize o formato AAAA-MM-DD")
  .refine((value) => {
    const date = new Date(value);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, "Data inválida");

export const createOrderSchema = z.strictObject({
  cliente: z
    .string()
    .trim()
    .min(2, "Informe o nome do cliente")
    .max(100, "O nome pode ter no máximo 100 caracteres"),
  telefone: phoneSchema,
  produto: z
    .string()
    .trim()
    .min(2, "Informe o produto")
    .max(200, "O produto pode ter no máximo 200 caracteres"),
  dataEntrega: isoDateSchema,
});

export const updateOrderSchema = createOrderSchema
  .partial()
  .extend({ status: z.enum(ORDER_STATUS).optional() })
  .refine((data) => Object.keys(data).length > 0, "Envie pelo menos um campo");

export type OrderStatus = (typeof ORDER_STATUS)[number];
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

export type Order = {
  id: number;
  cliente: string;
  telefone: string;
  produto: string;
  dataEntrega: string;
  status: OrderStatus;
  criadaEm: string;
};

export type Availability = {
  data: string;
  limite: number;
  ocupadas: number;
  vagas: number;
  disponivel: boolean;
};

export type ErrorDetail = {
  campo: string;
  mensagem: string;
};

export type ApiError = {
  erro: string;
  detalhes?: ErrorDetail[];
};
