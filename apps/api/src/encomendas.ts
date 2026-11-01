import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  STATUS,
  atualizarEncomendaSchema,
  novaEncomendaSchema,
} from "@cafe/shared";
import { prisma } from "./db";
import { hojeNoBrasil, paraData, paraTexto } from "./datas";
import { ErroHttp, naoEncontrado, validar } from "./erros";

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const filtroSchema = z.object({
  data: novaEncomendaSchema.shape.dataEntrega.optional(),
  status: z.enum(STATUS).optional(),
});

function serializar(e: {
  id: number;
  cliente: string;
  telefone: string;
  produto: string;
  dataEntrega: Date;
  status: string;
  criadaEm: Date;
}) {
  return { ...e, dataEntrega: paraTexto(e.dataEntrega) };
}

function garantirDataNaoPassada(data: string): void {
  if (data < hojeNoBrasil()) {
    throw new ErroHttp(400, "A data de entrega não pode estar no passado");
  }
}

export async function encomendasRoutes(app: FastifyInstance) {
  app.post("/", async (req, reply) => {
    const dados = validar(novaEncomendaSchema, req.body);
    garantirDataNaoPassada(dados.dataEntrega);

    const criada = await prisma.encomenda.create({
      data: { ...dados, dataEntrega: paraData(dados.dataEntrega) },
    });

    return reply.code(201).send(serializar(criada));
  });

  app.get("/", async (req) => {
    const filtro = validar(filtroSchema, req.query);

    const encomendas = await prisma.encomenda.findMany({
      where: {
        dataEntrega: filtro.data ? paraData(filtro.data) : undefined,
        status: filtro.status,
      },
      orderBy: [{ dataEntrega: "asc" }, { id: "asc" }],
    });

    return encomendas.map(serializar);
  });

  app.patch("/:id", async (req) => {
    const { id } = validar(paramsSchema, req.params);
    const dados = validar(atualizarEncomendaSchema, req.body);
    if (dados.dataEntrega) garantirDataNaoPassada(dados.dataEntrega);

    try {
      const atualizada = await prisma.encomenda.update({
        where: { id },
        data: {
          ...dados,
          dataEntrega: dados.dataEntrega
            ? paraData(dados.dataEntrega)
            : undefined,
        },
      });
      return serializar(atualizada);
    } catch (erro) {
      if (naoEncontrado(erro))
        throw new ErroHttp(404, "Encomenda não encontrada");
      throw erro;
    }
  });

  app.delete("/:id", async (req, reply) => {
    const { id } = validar(paramsSchema, req.params);

    try {
      await prisma.encomenda.delete({ where: { id } });
    } catch (erro) {
      if (naoEncontrado(erro))
        throw new ErroHttp(404, "Encomenda não encontrada");
      throw erro;
    }

    return reply.code(204).send();
  });
}
