import {
  DAILY_LIMIT,
  ORDER_STATUS,
  type Order,
  type OrderStatus,
} from "@cafe/shared";
import Link from "next/link";
import { CupLogo } from "@/components/cup-logo";
import { CAFE_INFO } from "@/data/cafe";
import { formatIsoDateBr, todayIsoInBrazil } from "@/lib/format";
import { isAdminAuthenticated, logoutAdminAction } from "./actions";
import { AdminLoginForm } from "./login-form";
import { OrderCard } from "./order-card";

const API_URL: string =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3333";

type SearchParams = Promise<{
  data?: string;
  status?: string;
}>;

async function fetchOrders(
  dateFilter?: string,
  statusFilter?: OrderStatus,
): Promise<{ orders: Order[]; error?: string }> {
  const params = new URLSearchParams();
  if (dateFilter) params.set("data", dateFilter);
  if (statusFilter) params.set("status", statusFilter);

  const query = params.toString();
  const url = `${API_URL}/encomendas${query ? `?${query}` : ""}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        orders: [],
        error: "Não foi possível carregar as encomendas da API.",
      };
    }

    const orders = (await response.json()) as Order[];
    return { orders };
  } catch {
    return {
      orders: [],
      error:
        "A API de encomendas parece estar desligada. Verifique se o servidor está rodando.",
    };
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return (
      <div className="min-h-screen px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-md text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-cinnamon hover:text-espresso"
          >
            ← Voltar para o site do {CAFE_INFO.name}
          </Link>
        </div>
        <AdminLoginForm />
      </div>
    );
  }

  const rawParams = await searchParams;
  const today = todayIsoInBrazil();

  const dateFilter =
    rawParams.data && /^\d{4}-\d{2}-\d{2}$/.test(rawParams.data)
      ? rawParams.data
      : undefined;

  const statusFilter = ORDER_STATUS.includes(rawParams.status as OrderStatus)
    ? (rawParams.status as OrderStatus)
    : undefined;

  const { orders, error } = await fetchOrders(dateFilter, statusFilter);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topo simples para celular */}
      <header className="border-b border-biscuit bg-cream px-4 py-3.5 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CupLogo className="h-8 w-8 text-terracotta" />
            <div>
              <h1 className="font-serif text-lg font-bold leading-none text-espresso">
                Caderno de Encomendas
              </h1>
              <p className="text-xs text-cinnamon">
                Painel da {CAFE_INFO.owner}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-biscuit px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-latte"
            >
              Ver site
            </Link>
            <form action={logoutAdminAction}>
              <button
                type="submit"
                className="cursor-pointer text-xs font-semibold text-cinnamon underline decoration-biscuit underline-offset-4 hover:text-terracotta"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Filtros rápidos */}
        <section className="rounded-2xl border border-biscuit bg-latte/50 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                !dateFilter && !statusFilter
                  ? "bg-espresso text-cream"
                  : "border border-biscuit bg-cream text-espresso hover:bg-latte"
              }`}
            >
              Todas
            </Link>
            <Link
              href={`/admin?data=${today}`}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                dateFilter === today
                  ? "bg-espresso text-cream"
                  : "border border-biscuit bg-cream text-espresso hover:bg-latte"
              }`}
            >
              Para hoje ({formatIsoDateBr(today)})
            </Link>
            <Link
              href="/admin?status=RECEBIDA"
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                statusFilter === "RECEBIDA"
                  ? "bg-terracotta text-cream"
                  : "border border-biscuit bg-cream text-espresso hover:bg-latte"
              }`}
            >
              Recebidas
            </Link>
            <Link
              href="/admin?status=PREPARO"
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                statusFilter === "PREPARO"
                  ? "bg-terracotta text-cream"
                  : "border border-biscuit bg-cream text-espresso hover:bg-latte"
              }`}
            >
              Em preparo
            </Link>
            <Link
              href="/admin?status=ENTREGUE"
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                statusFilter === "ENTREGUE"
                  ? "bg-sage text-cream"
                  : "border border-biscuit bg-cream text-espresso hover:bg-latte"
              }`}
            >
              Entregues
            </Link>
          </div>

          {/* Filtro por data específica */}
          <form
            method="GET"
            action="/admin"
            className="mt-3 flex flex-wrap items-center gap-2 border-t border-biscuit/70 pt-3"
          >
            <label
              htmlFor="filtro-data"
              className="text-xs font-semibold text-cinnamon"
            >
              Ver dia específico:
            </label>
            <input
              id="filtro-data"
              name="data"
              type="date"
              defaultValue={dateFilter ?? ""}
              className="rounded-xl border border-biscuit bg-cream px-3 py-1.5 text-xs text-espresso"
            />
            {statusFilter ? (
              <input type="hidden" name="status" value={statusFilter} />
            ) : null}
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-terracotta px-3.5 py-1.5 text-xs font-semibold text-cream hover:bg-espresso"
            >
              Filtrar
            </button>
            {dateFilter || statusFilter ? (
              <Link
                href="/admin"
                className="text-xs font-medium text-cinnamon underline underline-offset-4 hover:text-espresso"
              >
                Limpar filtro
              </Link>
            ) : null}
          </form>
        </section>

        {/* Resumo de ocupação */}
        {dateFilter && !statusFilter ? (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-biscuit bg-cream px-4 py-3 text-sm">
            <span className="font-medium text-espresso">
              Ocupação em <strong>{formatIsoDateBr(dateFilter)}</strong>:
            </span>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                orders.length >= DAILY_LIMIT
                  ? "bg-terracotta/15 text-terracotta"
                  : "bg-sage/15 text-sage"
              }`}
            >
              {orders.length} de {DAILY_LIMIT} bolos
            </span>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-terracotta/40 bg-terracotta/10 p-4 text-sm font-medium text-terracotta"
          >
            {error}
          </div>
        ) : null}

        {/* Lista de encomendas */}
        {orders.length === 0 && !error ? (
          <div className="mt-8 rounded-2xl border border-biscuit bg-cream p-8 text-center">
            <p className="font-serif text-lg font-semibold text-espresso">
              Nenhuma encomenda encontrada
            </p>
            <p className="mt-1 text-sm text-cinnamon">
              Quando um cliente pedir pelo site, a encomenda aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
