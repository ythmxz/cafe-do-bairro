export type MenuItem = {
  name: string;
  description: string;
  price: string;
  badge?: string;
  orderable?: boolean;
};

export type ScheduleItem = {
  days: string;
  hours: string;
};

export const CAFE_INFO = {
  name: "Café do Bairro",
  owner: "Dona Marta",
  since: 2020,
  tagline: "Café coado na hora, pão de queijo e bolos com gosto de casa de vó.",
  story:
    "Há seis anos na esquina do bairro, passando café fresquinho para quem vai trabalhar, para a turma da faculdade e para os vizinhos de sempre. As fornadas saem todos os dias e os bolos inteiros são feitos sob encomenda — até 5 por dia, para cada um sair do forno com o cuidado que merece.",
  whatsappNumber: "5573912345678",
  whatsappDisplay: "(73) 91234-5678",
  instagramHandle: "@cafedobairro",
  instagramUrl: "https://instagram.com",
  address: {
    street: "Rua das Acácias, 142 — Centro",
    neighborhood: "Ao lado da Papelaria São Jorge",
    city: "Ilhéus — BA",
    mapsUrl: "https://maps.google.com/?q=Ilheus+BA",
  },
  schedule: [
    { days: "Segunda a Sexta", hours: "07h às 18h30" },
    { days: "Sábado", hours: "07h30 às 13h" },
    { days: "Domingo e feriados", hours: "Fechado (forno descansando)" },
  ] satisfies ScheduleItem[],
} as const;

export const DAILY_MENU: MenuItem[] = [
  {
    name: "Café coado no pano",
    description: "Passado na hora, puro ou com leite quente bem espumado.",
    price: "R$ 5,00",
  },
  {
    name: "Pão de queijo da canastra",
    description:
      "Assado em fornadas pequenas ao longo do dia, casquinha crocante.",
    price: "R$ 6,00",
    badge: "Sai quentinho",
  },
  {
    name: "Fatia do bolo do dia",
    description: "Fatia generosa dos bolos que saíram do forno pela manhã.",
    price: "R$ 8,00",
  },
  {
    name: "Broa de fubá com erva-doce",
    description: "Receita antiga de família, perfeita para acompanhar o café.",
    price: "R$ 5,50",
  },
];

export const ORDER_CAKES: MenuItem[] = [
  {
    name: "Bolo de cenoura com calda de chocolate",
    description:
      "Massa fofinha e cobertura grossa de chocolate feito na panela.",
    price: "R$ 48,00",
    badge: "Mais pedido",
    orderable: true,
  },
  {
    name: "Bolo de fubá cremoso com goiabada",
    description:
      "Fubá de moinho d'água com pedaços de goiabada cascão derretida.",
    price: "R$ 45,00",
    orderable: true,
  },
  {
    name: "Bolo de laranja com calda da fruta",
    description: "Molhadinho, perfumado com raspas de laranja-baía fresca.",
    price: "R$ 42,00",
    orderable: true,
  },
  {
    name: "Bolo de milho verde de espiga",
    description: "Feito no liquidificador com milho debulhado e coco ralado.",
    price: "R$ 46,00",
    orderable: true,
  },
  {
    name: "Bolo formigueiro com coco",
    description: "Clássico de vó para café da tarde em família.",
    price: "R$ 44,00",
    orderable: true,
  },
  {
    name: "Bolo natalino de frutas e castanhas",
    description:
      "Especial de fim de ano com frutas cristalizadas, nozes e especiarias.",
    price: "R$ 68,00",
    badge: "Especial de Natal",
    orderable: true,
  },
  {
    name: "Panetone artesanal de fermentação natural",
    description:
      "Forno de novembro e dezembro — frutas ou gotas de chocolate (750g).",
    price: "R$ 58,00",
    badge: "Especial de Natal",
    orderable: true,
  },
];

export const ORDERABLE_PRODUCTS: string[] = ORDER_CAKES.map(
  (cake) => cake.name,
);

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${CAFE_INFO.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
