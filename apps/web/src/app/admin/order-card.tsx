"use client";

import { ORDER_STATUS, type Order, type OrderStatus } from "@cafe/shared";
import { useState, useTransition } from "react";
import { formatIsoDateBr, formatPhoneBr } from "@/lib/format";
import { deleteOrderAction, updateOrderStatusAction } from "./actions";

const STATUS_LABELS: Record<
  OrderStatus,
  { label: string; badgeClass: string; activeButtonClass: string }
> = {
  RECEBIDA: {
    label: "Recebida",
    badgeClass: "bg-caramel/15 text-terracotta border-caramel/30",
    activeButtonClass: "bg-terracotta text-cream border-terracotta",
  },
  PREPARO: {
    label: "Em preparo",
    badgeClass: "bg-latte text-espresso border-biscuit",
    activeButtonClass: "bg-espresso text-cream border-espresso",
  },
  ENTREGUE: {
    label: "Entregue",
    badgeClass: "bg-sage/15 text-sage border-sage/30",
    activeButtonClass: "bg-sage text-cream border-sage",
  },
};

function buildCustomerWhatsAppUrl(order: Order): string {
  const digits = order.telefone.replace(/\D/g, "");
  const phoneWithCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const text = `Olá, ${order.cliente}! Aqui é a Dona Marta, do Café do Bairro. Estou falando sobre sua encomenda (#${order.id} - ${order.produto}) para o dia
      ${formatIsoDateBr(order.dataEntrega)}.`;
  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
}

export function OrderCard({ order }: { order: Order }) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const currentMeta = STATUS_LABELS[order.status];

  function handleStatusChange(nextStatus: OrderStatus): void {
    if (nextStatus === order.status) return;
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatusAction(order.id, nextStatus);
      if (result.error) setError(result.error);
    });
  }

  function handleDelete(): void {
    setError(null);
    startTransition(async () => {
      const result = await deleteOrderAction(order.id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <article
      className={`rounded-2xl border border-biscuit bg-cream p-5 shadow-xs transition ${
        isPending ? "opacity-60" : ""
      }`}
    >
      {/* Topo do cartão */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-biscuit/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-latte px-2.5 py-1 font-serif text-sm font-bold text-espresso">
            Entrega: {formatIsoDateBr(order.dataEntrega)}
          </span>
          <span className="text-xs font-medium text-cinnamon">#{order.id}</span>
        </div>

        <span
          className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${currentMeta.badgeClass}`}
        >
          {currentMeta.label}
        </span>
      </div>

      {/* Dados principais */}
      <div className="mt-3.5">
        <h3 className="font-serif text-lg font-bold text-espresso">
          {order.produto}
        </h3>
        <p className="mt-1 text-sm text-cinnamon">
          Cliente:{" "}
          <strong className="font-semibold text-espresso">
            {order.cliente}
          </strong>{" "}
          · {formatPhoneBr(order.telefone)}
        </p>
      </div>

      {/* Troca de status */}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-cinnamon">
          Mudar status:
        </p>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {ORDER_STATUS.map((status) => {
            const meta = STATUS_LABELS[status];
            const isActive = order.status === status;
            return (
              <button
                key={status}
                type="button"
                disabled={isPending}
                onClick={() => handleStatusChange(status)}
                className={`cursor-pointer rounded-xl border px-2.5 py-2 text-xs font-semibold transition ${
                  isActive
                    ? meta.activeButtonClass
                    : "border-biscuit bg-latte/50 text-espresso hover:bg-latte"
                }`}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-xs font-medium text-terracotta">{error}</p>
      ) : null}

      {/* Rodapé do cartão */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-biscuit/70 pt-3">
        <a
          href={buildCustomerWhatsAppUrl(order)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-sage/15 px-3.5 py-2 text-xs font-semibold text-sage transition hover:bg-sage hover:text-cream"
        >
          Chamar {order.cliente.split(" ")[0]} no WhatsApp
        </a>

        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-cinnamon">Apagar pedido?</span>
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="cursor-pointer rounded-lg bg-terracotta px-2.5 py-1.5 text-xs font-semibold text-cream"
            >
              Sim, apagar
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirmDelete(false)}
              className="cursor-pointer rounded-lg border border-biscuit px-2.5 py-1.5 text-xs font-medium text-cinnamon"
            >
              Não
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="cursor-pointer text-xs font-medium text-cinnamon underline decoration-biscuit underline-offset-4 hover:text-terracotta"
          >
            Remover
          </button>
        )}
      </div>
    </article>
  );
}
