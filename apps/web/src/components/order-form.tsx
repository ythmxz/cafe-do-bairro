"use client";

import {
  type ApiError,
  type Availability,
  createOrderSchema,
  DAILY_LIMIT,
  type Order,
} from "@cafe/shared";
import { type SubmitEvent, useEffect, useState } from "react";
import { buildWhatsAppUrl, CAFE_INFO, ORDERABLE_PRODUCTS } from "@/data/cafe";
import { formatIsoDateBr, formatPhoneBr, todayIsoInBrazil } from "@/lib/format";

const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

type FieldErrors = Partial<
  Record<"cliente" | "telefone" | "produto" | "dataEntrega", string>
>;

export function OrderForm() {
  const minDate = todayIsoInBrazil();

  const [cliente, setCliente] = useState<string>("");
  const [telefone, setTelefone] = useState<string>("");
  const [produto, setProduto] = useState<string>(ORDERABLE_PRODUCTS[0] ?? "");
  const [dataEntrega, setDataEntrega] = useState<string>(minDate);

  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loadingAvailability, setLoadingAvailability] =
    useState<boolean>(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  useEffect(() => {
    function handleSelectProduct(event: Event): void {
      const custom = event as CustomEvent<string>;
      if (custom.detail) {
        setProduto(custom.detail);
        setCreatedOrder(null);
      }
    }

    window.addEventListener("select-product", handleSelectProduct);
    return () =>
      window.removeEventListener("select-product", handleSelectProduct);
  }, []);

  // Consulta as vagas restantes sempre que a data de entrega muda
  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataEntrega) || dataEntrega < minDate) {
      setAvailability(null);
      return;
    }

    const controller = new AbortController();
    setLoadingAvailability(true);

    fetch(`${API_BASE_URL}/disponibilidade?data=${dataEntrega}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          setAvailability(null);
          return;
        }
        const data = (await res.json()) as Availability;
        setAvailability(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAvailability(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingAvailability(false);
        }
      });

    return () => controller.abort();
  }, [dataEntrega, minDate]);

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const parsed = createOrderSchema.safeParse({
      cliente,
      telefone,
      produto,
      dataEntrega,
    });

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FieldErrors | undefined;
        if (field && !nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/encomendas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const body = (await response
          .json()
          .catch(() => null)) as ApiError | null;
        if (body?.detalhes) {
          const nextErrors: FieldErrors = {};
          for (const detail of body.detalhes) {
            const field = detail.campo as keyof FieldErrors;
            if (!nextErrors[field]) {
              nextErrors[field] = detail.mensagem;
            }
          }
          setFieldErrors(nextErrors);
        }
        setFormError(
          body?.erro ??
            "Não foi possível registrar sua encomenda agora. Tente novamente ou chame no WhatsApp.",
        );
        return;
      }

      const order = (await response.json()) as Order;
      setCreatedOrder(order);
      setCliente("");
      setTelefone("");
      setAvailability((prev) =>
        prev
          ? {
              ...prev,
              ocupadas: prev.ocupadas + 1,
              vagas: Math.max(prev.vagas - 1, 0),
              disponivel: prev.vagas - 1 > 0,
            }
          : null,
      );
    } catch {
      setFormError(
        "Não conseguimos conectar ao servidor. Você também pode pedir direto pelo WhatsApp abaixo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (createdOrder) {
    const confirmationMessage = [
      `Olá, Dona Marta! Acabei de registrar a encomenda #${createdOrder.id} pelo site:`,
      `• Produto: ${createdOrder.produto}`,
      `• Data de retirada: ${formatIsoDateBr(createdOrder.dataEntrega)}`,
      `• Nome: ${createdOrder.cliente}`,
    ].join("\n");

    return (
      <div className="rounded-2xl border border-sage/40 bg-cream p-6 text-left shadow-xs sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-sage/15 px-3 py-1 text-xs font-semibold text-sage">
          ✓ Encomenda anotada no caderno da {CAFE_INFO.owner}
        </div>

        <h3 className="mt-3 font-serif text-2xl font-bold text-espresso">
          Obrigado, {createdOrder.cliente}!
        </h3>
        <p className="mt-1 text-sm text-cinnamon">
          Seu pedido já está na lista da {CAFE_INFO.owner}. Confira os dados:
        </p>

        <dl className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-biscuit bg-latte/50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-cinnamon">Número do pedido</dt>
            <dd className="font-semibold text-espresso">#{createdOrder.id}</dd>
          </div>
          <div>
            <dt className="text-xs text-cinnamon">Data para retirar</dt>
            <dd className="font-semibold text-espresso">
              {formatIsoDateBr(createdOrder.dataEntrega)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-cinnamon">Produto</dt>
            <dd className="font-semibold text-espresso">
              {createdOrder.produto}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={buildWhatsAppUrl(confirmationMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-sage px-5 py-3 text-sm font-semibold text-cream transition hover:opacity-95"
          >
            Enviar comprovante no WhatsApp (opcional)
          </a>
          <button
            type="button"
            onClick={() => setCreatedOrder(null)}
            className="inline-flex items-center justify-center rounded-xl border border-biscuit bg-cream px-5 py-3 text-sm font-semibold text-espresso transition hover:bg-latte"
          >
            Fazer outra encomenda
          </button>
        </div>
      </div>
    );
  }

  const isDayFull = availability !== null && !availability.disponivel;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-biscuit bg-cream p-6 text-left shadow-xs sm:p-8"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Nome do cliente */}
        <div>
          <label
            htmlFor="cliente"
            className="block text-sm font-semibold text-espresso"
          >
            Seu nome
          </label>
          <input
            id="cliente"
            name="cliente"
            type="text"
            required
            maxLength={100}
            placeholder="Ex.: Maria Aparecida"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-biscuit bg-cream px-3.5 py-2.5 text-sm text-espresso placeholder:text-cinnamon/60 focus:border-terracotta
                focus:outline-none"
          />
          {fieldErrors.cliente ? (
            <p className="mt-1 text-xs font-medium text-terracotta">
              {fieldErrors.cliente}
            </p>
          ) : null}
        </div>

        {/* Telefone / WhatsApp */}
        <div>
          <label
            htmlFor="telefone"
            className="block text-sm font-semibold text-espresso"
          >
            Seu WhatsApp (com DDD)
          </label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="numeric"
            required
            placeholder="(73) 99999-9999"
            value={telefone}
            onChange={(e) => setTelefone(formatPhoneBr(e.target.value))}
            className="mt-1.5 w-full rounded-xl border border-biscuit bg-cream px-3.5 py-2.5 text-sm text-espresso placeholder:text-cinnamon/60 focus:border-terracotta
                focus:outline-none"
          />
          {fieldErrors.telefone ? (
            <p className="mt-1 text-xs font-medium text-terracotta">
              {fieldErrors.telefone}
            </p>
          ) : null}
        </div>

        {/* Produto */}
        <div className="sm:col-span-2">
          <label
            htmlFor="produto"
            className="block text-sm font-semibold text-espresso"
          >
            Qual bolo você quer encomendar?
          </label>
          <select
            id="produto"
            name="produto"
            value={produto}
            onChange={(e) => setProduto(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-biscuit bg-cream px-3.5 py-2.5 text-sm text-espresso focus:border-terracotta focus:outline-none"
          >
            {ORDERABLE_PRODUCTS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {fieldErrors.produto ? (
            <p className="mt-1 text-xs font-medium text-terracotta">
              {fieldErrors.produto}
            </p>
          ) : null}
        </div>

        {/* Data de entrega + indicador de vagas */}
        <div className="sm:col-span-2">
          <label
            htmlFor="dataEntrega"
            className="block text-sm font-semibold text-espresso"
          >
            Data para retirar no café
          </label>
          <div className="mt-1.5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <input
              id="dataEntrega"
              name="dataEntrega"
              type="date"
              required
              min={minDate}
              value={dataEntrega}
              onChange={(e) => setDataEntrega(e.target.value)}
              className="rounded-xl border border-biscuit bg-cream px-3.5 py-2.5 text-sm text-espresso focus:border-terracotta focus:outline-none sm:w-56"
            />

            {loadingAvailability ? (
              <span className="text-xs text-cinnamon">
                Consultando o caderno da {CAFE_INFO.owner}...
              </span>
            ) : availability ? (
              availability.disponivel ? (
                <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-sage/15 px-3 py-1 text-xs font-semibold text-sage sm:self-auto">
                  ● Restam {availability.vagas} de {DAILY_LIMIT} vagas para{" "}
                  {formatIsoDateBr(availability.data)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-terracotta/15 px-3 py-1 text-xs font-semibold text-terracotta sm:self-auto">
                  ✕ Agenda cheia em {formatIsoDateBr(availability.data)} (
                  {DAILY_LIMIT}/{DAILY_LIMIT} bolos). Escolha outro dia.
                </span>
              )
            ) : null}
          </div>
          {fieldErrors.dataEntrega ? (
            <p className="mt-1 text-xs font-medium text-terracotta">
              {fieldErrors.dataEntrega}
            </p>
          ) : null}
        </div>
      </div>

      {formError ? (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-terracotta/40 bg-terracotta/10 p-3.5 text-sm font-medium text-terracotta"
        >
          {formError}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-cinnamon">
          Sem pagamento online: você acerta na retirada no balcão.
        </p>

        <button
          type="submit"
          disabled={submitting || isDayFull}
          className="inline-flex items-center justify-center rounded-xl bg-terracotta px-6 py-3 text-sm font-semibold text-cream shadow-xs transition hover:bg-espresso
              disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Anotando pedido..."
            : isDayFull
              ? "Data sem vagas disponíveis"
              : "Confirmar encomenda"}
        </button>
      </div>
    </form>
  );
}
