import { DAILY_LIMIT } from "@cafe/shared";
import Link from "next/link";
import { CupLogo } from "@/components/cup-logo";
import {
  buildWhatsAppUrl,
  CAFE_INFO,
  DAILY_MENU,
  type MenuItem,
  ORDER_CAKES,
} from "@/data/cafe";

const DEFAULT_WHATSAPP_MESSAGE =
  "Olá, Dona Marta! Vi o site do Café do Bairro e gostaria de fazer uma encomenda.";

function MenuCard({ item }: { item: MenuItem }) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-biscuit bg-cream/80 p-5 shadow-xs transition hover:border-caramel/60">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg font-semibold text-espresso">
            {item.name}
          </h3>
          <span className="shrink-0 rounded-full bg-latte px-3 py-1 text-sm font-semibold text-terracotta">
            {item.price}
          </span>
        </div>

        {item.badge ? (
          <span className="mt-2 inline-block rounded-md bg-caramel/15 px-2.5 py-0.5 text-xs font-medium text-terracotta">
            {item.badge}
          </span>
        ) : null}

        <p className="mt-2.5 text-sm leading-relaxed text-cinnamon">
          {item.description}
        </p>
      </div>

      {item.orderable ? (
        <div className="mt-4 pt-3 border-t border-biscuit/70">
          <a
            href="#encomendar"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta hover:text-espresso"
          >
            Encomendar este bolo
            <span aria-hidden="true">→</span>
          </a>
        </div>
      ) : null}
    </article>
  );
}

export default function HomePage() {
  const whatsappHref = buildWhatsAppUrl(DEFAULT_WHATSAPP_MESSAGE);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Cabeçalho fixo pensato para tela de celular */}
      <header className="sticky top-0 z-30 border-b border-biscuit/80 bg-cream/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="#topo" className="flex items-center gap-2.5 text-espresso">
            <CupLogo className="h-9 w-9 text-terracotta" />
            <div>
              <span className="block font-serif text-lg font-bold leading-none">
                {CAFE_INFO.name}
              </span>
              <span className="text-xs text-cinnamon">
                por {CAFE_INFO.owner} · desde {CAFE_INFO.since}
              </span>
            </div>
          </a>

          <nav
            aria-label="Navegação principal"
            className="flex items-center gap-2 sm:gap-5 text-sm font-medium text-cinnamon"
          >
            <a
              href="#cardapio"
              className="rounded-lg px-2.5 py-1.5 hover:bg-latte hover:text-espresso"
            >
              Cardápio
            </a>
            <a
              href="#horarios"
              className="hidden sm:inline-block rounded-lg px-2.5 py-1.5 hover:bg-latte hover:text-espresso"
            >
              Horário & Local
            </a>
            <a
              href="#encomendar"
              className="rounded-full bg-terracotta px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-cream shadow-xs transition hover:bg-espresso"
            >
              Encomendar
            </a>
          </nav>
        </div>
      </header>

      <main id="topo" className="flex-1">
        {/* Hero acolhedor */}
        <section className="border-b border-biscuit/80 bg-linear-to-b from-latte/70 to-cream px-4 py-10 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-biscuit bg-cream px-3.5 py-1 text-xs font-medium text-cinnamon">
              <span className="h-2 w-2 rounded-full bg-sage" />
              Fornadas diárias · Encomendas até {DAILY_LIMIT} bolos por dia
            </p>

            <h1 className="mt-5 font-serif text-3xl font-bold tracking-tight text-espresso sm:text-5xl sm:leading-tight">
              {CAFE_INFO.tagline}
            </h1>

            <p className="mt-4 text-base leading-relaxed text-cinnamon sm:text-lg">
              {CAFE_INFO.story}
            </p>

            <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <a
                href="#encomendar"
                className="inline-flex items-center justify-center rounded-xl bg-terracotta px-6 py-3.5 text-base font-semibold text-cream shadow-sm transition
                    hover:bg-espresso"
              >
                Fazer encomenda pelo site
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-biscuit bg-cream px-6 py-3.5 text-base font-semibold text-espresso transition
                    hover:bg-latte"
              >
                Pedir pelo WhatsApp
              </a>
            </div>

            {/* Resumo rápido de horário e endereço logo na primeira dobra para quem vem do Instagram */}
            <div className="mt-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
              <a
                href="#horarios"
                className="flex items-start gap-3 rounded-2xl border border-biscuit/90 bg-cream/90 p-4 transition hover:border-caramel"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-latte font-serif text-base font-bold text-terracotta"
                >
                  ⏰
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-cinnamon">
                    Horário de hoje
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-espresso">
                    Seg a Sex: 07h às 18h30 · Sáb: até 13h
                  </p>
                </div>
              </a>

              <a
                href="#horarios"
                className="flex items-start gap-3 rounded-2xl border border-biscuit/90 bg-cream/90 p-4 transition hover:border-caramel"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-latte font-serif text-base font-bold text-terracotta"
                >
                  📍
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-cinnamon">
                    Onde estamos
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-espresso">
                    {CAFE_INFO.address.street}
                  </p>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* Cardápio */}
        <section
          id="cardapio"
          className="scroll-mt-16 mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-terracotta">
              Nosso cardápio
            </span>
            <h2 className="mt-1 font-serif text-2xl font-bold text-espresso sm:text-3xl">
              Feito em casa, sem pressa
            </h2>
            <p className="mt-2 text-sm sm:text-base text-cinnamon">
              No balcão temos café passado na hora e fornadas ao longo do dia.
              Os bolos inteiros são assados sob encomenda para você retirar
              fresquinho.
            </p>
          </div>

          {/* Para tomar aqui no café */}
          <div className="mt-8">
            <h3 className="font-serif text-lg font-semibold text-espresso border-b border-biscuit pb-2">
              Todo dia no balcão
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {DAILY_MENU.map((item) => (
                <MenuCard key={item.name} item={item} />
              ))}
            </div>
          </div>

          {/* Bolos sob encomenda */}
          <div className="mt-12">
            <div className="flex flex-col justify-between gap-2 border-b border-biscuit pb-3 sm:flex-row sm:items-end">
              <div>
                <h3 className="font-serif text-xl font-bold text-espresso">
                  Bolos inteiros & especiais sob encomenda
                </h3>
                <p className="text-sm text-cinnamon">
                  Produzimos no máximo{" "}
                  <strong className="font-semibold text-espresso">
                    {DAILY_LIMIT} encomendas por dia
                  </strong>{" "}
                  para manter a qualidade caseira.
                </p>
              </div>
              <span className="self-start rounded-full bg-sage/15 px-3 py-1 text-xs font-semibold text-sage sm:self-auto">
                Agenda de Natal e fim de ano aberta
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ORDER_CAKES.map((cake) => (
                <MenuCard key={cake.name} item={cake} />
              ))}
            </div>
          </div>
        </section>

        {/* Seção de Encomenda */}
        <section
          id="encomendar"
          className="scroll-mt-16 border-y border-biscuit bg-latte/60 px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-terracotta">
              Encomendas sem fila
            </span>
            <h2 className="mt-1 font-serif text-2xl font-bold text-espresso sm:text-3xl">
              Reserve seu bolo para retirar no café
            </h2>
            <p className="mt-2 text-sm sm:text-base text-cinnamon">
              A {CAFE_INFO.owner} prepara até {DAILY_LIMIT} bolos por dia. Se
              preferir combinar detalhes diretamente com ela, é só chamar no
              WhatsApp:
            </p>
            <div className="mt-6">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-sage px-6 py-3.5 text-base font-semibold text-cream shadow-xs transition hover:opacity-95"
              >
                Encomendar pelo WhatsApp ({CAFE_INFO.whatsappDisplay})
              </a>
            </div>
          </div>
        </section>

        {/* Horário e Endereço */}
        <section
          id="horarios"
          className="scroll-mt-16 mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Horários */}
            <div className="rounded-2xl border border-biscuit bg-cream p-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-terracotta">
                Quando passar aqui
              </span>
              <h2 className="mt-1 font-serif text-2xl font-bold text-espresso">
                Horário de funcionamento
              </h2>
              <dl className="mt-5 divide-y divide-biscuit/70">
                {CAFE_INFO.schedule.map((item) => (
                  <div
                    key={item.days}
                    className="flex items-center justify-between py-3 text-sm sm:text-base"
                  >
                    <dt className="font-medium text-espresso">{item.days}</dt>
                    <dd className="font-semibold text-cinnamon">
                      {item.hours}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 rounded-xl bg-latte/70 p-3 text-xs leading-relaxed text-cinnamon">
                Dica da {CAFE_INFO.owner}: as fornadas de pão de queijo saem às
                08h, 11h e 15h30.
              </p>
            </div>

            {/* Endereço e Contato */}
            <div className="flex flex-col justify-between rounded-2xl border border-biscuit bg-cream p-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-terracotta">
                  Venha tomar uma xícara
                </span>
                <h2 className="mt-1 font-serif text-2xl font-bold text-espresso">
                  Onde fica o Café do Bairro
                </h2>
                <address className="mt-4 not-italic space-y-1 text-base text-espresso">
                  <p className="font-semibold">{CAFE_INFO.address.street}</p>
                  <p className="text-sm text-cinnamon">
                    {CAFE_INFO.address.neighborhood}
                  </p>
                  <p className="text-sm text-cinnamon">
                    {CAFE_INFO.address.city}
                  </p>
                </address>

                <div className="mt-5 space-y-2 text-sm text-cinnamon">
                  <p>
                    <strong className="text-espresso">WhatsApp:</strong>{" "}
                    {CAFE_INFO.whatsappDisplay}
                  </p>
                  <p>
                    <strong className="text-espresso">Instagram:</strong>{" "}
                    <a
                      href={CAFE_INFO.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-caramel underline-offset-4 hover:text-espresso"
                    >
                      {CAFE_INFO.instagramHandle}
                    </a>
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <a
                  href={CAFE_INFO.address.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-biscuit bg-latte px-4 py-2.5 text-sm font-semibold text-espresso transition
                      hover:bg-biscuit/60"
                >
                  Abrir no Google Maps
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-terracotta px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-espresso"
                >
                  Chamar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Rodapé com acesso discreto para o painel da Dona Marta */}
      <footer className="border-t border-biscuit bg-latte/50 px-4 py-8 text-sm text-cinnamon sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <CupLogo className="h-6 w-6 text-terracotta" />
            <span className="font-serif font-semibold text-espresso">
              {CAFE_INFO.name}
            </span>
            <span>· Feito com carinho para a vizinhança</span>
          </div>

          <Link
            href="/admin"
            className="text-xs font-medium text-cinnamon underline decoration-biscuit underline-offset-4 hover:text-espresso"
          >
            Caderno de encomendas ({CAFE_INFO.owner})
          </Link>
        </div>
      </footer>
    </div>
  );
}
