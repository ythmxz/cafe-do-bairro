import z from "zod";

export const STATUS = ["RECEBIDA", "PREPARO", "ENTREGUE"] as const;
export const LIMITE_DIARIO = 5;

const telefone = z
  .string()
  .transform((valor) => valor.replace(/\D/g, ""))
  .pipe(
    z
      .string()
      .regex(
        /^\d{10,11}$/,
        "Utilize o formato DDD + Número, ex.: (73) 91234-5678",
      ),
  );

const dataISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Utilize o formato AAAA-MM-DD")
  .refine((valor) => {
    const data = new Date(valor);
    return (
      !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor
    );
  });

export const novaEncomendaSchema = z.strictObject({
  cliente: z.string().trim().min(2, "Informe o nome do cliente"),
  telefone,
  produto: z.string().trim().min(2, "Informe o produto"),
  dataEntrega: dataISO,
});

export const atualizarEncomendaSchema = novaEncomendaSchema
  .partial()
  .extend({ status: z.enum(STATUS).optional() })
  .refine(
    (dados) => Object.keys(dados).length > 0,
    "Envie pelo menos um campo",
  );

export type Status = (typeof STATUS)[number];
export type NovaEncomenda = z.infer<typeof novaEncomendaSchema>;
export type AtualizarEncomenda = z.infer<typeof atualizarEncomendaSchema>;
