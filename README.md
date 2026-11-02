# Café do Bairro — PROSEL 2026.2 TecnoJr

Solução completa (**Landing Page + Painel de Gestão Mobile + API REST de Encomendas**) desenvolvida para o **Café do Bairro**, da Dona Marta, como entrega do processo seletivo **PROSEL 2026.2 da TecnoJr**.

## Entendimento do Problema e Visão de Produto

A partir da entrevista com a Dona Marta, identificamos quatro dores principais no dia a dia do café:

1. **Perda de pedidos e sobrecarga no caderno de papel:** as encomendas chegam misturadas no WhatsApp, são anotadas manualmente e já houve perda de pedidos e marcação acima da capacidade diária (**máximo de 5 encomendas por dia**).

2. **Tempo perdido com perguntas repetitivas:** mesmo tendo Instagram, ela responde cerca de 20 vezes por dia às mesmas dúvidas sobre **cardápio, horário e endereço**.

3. **Familiaridade apenas com o celular:** a solução não pode exigir computador nem fluxos complexos — tanto os clientes quanto a Dona Marta acessam tudo pelo celular.

4. **Identidade acolhedora:** o visual precisa transmitir aconchego, em tons terrosos de café com leite, valorizando o desenho de xícara feito pelo filho dela.

## Arquitetura e Stack Tecnológica

O projeto foi estruturado como um **monorepo pnpm**, separando responsabilidades entre front-end, back-end e contratos compartilhados:

```text
cafe-do-bairro/
├── apps/
│   ├── api/          # API REST (Fastify 5 + Prisma 7 + PostgreSQL)
│   └── web/          # Landing Page & Painel da Dona Marta (Next.js 16 + Tailwind CSS v4)
├── packages/
│   └── shared/       # Schemas de validação (Zod) e tipos compartilhados entre API e Web
├── biome.json        # Padronização de formatação e lint em todo o monorepo
└── docker-compose.yml
```

### Principais decisões técnicas

- Contratos compartilhados (`@cafe/shared`): os schemas do Zod (`createOrderSchema`, `updateOrderSchema`, `isoDateSchema`) e constantes de negócio (`DAILY_LIMIT = 5`, `ORDER_STATUS`) ficam em um pacote único consumido tanto pela API quanto pelo front-end, evitando divergência de validação.

- Limite diário de 5 encomendas à prova de condição de corrida (race condition): em vez de apenas fazer um `COUNT` simples antes do `INSERT` (o que permitiria que dois pedidos simultâneos furassem o limite), a API utiliza `pg_advisory_xact_lock` do PostgreSQL por data dentro de uma transação (`prisma.$transaction`). Pedidos simultâneos para o mesmo dia são serializados no banco e o 6º pedido recebe 409 Conflict.

- Datas sem bug de fuso horário: as datas de entrega são armazenadas como `@db.Date` (YYYY-MM-DD) e a validação de data passada utiliza explicitamente o fuso America/Bahia (UTC-3).

- Segurança pensada para a persona: Na API, apenas POST `/encomendas` (com rate limit de 20 req/min) e GET `/disponibilidade` são públicos. As rotas de listagem, edição e exclusão exigem Bearer `ADMIN_TOKEN` (comparado em tempo constante com `timingSafeEqual`), pois contêm dados pessoais (nome e telefone dos clientes).

- No painel `/admin`, a Dona Marta entra com uma senha simples e humana (`ADMIN_PASSWORD`), mantida em cookie `httpOnly`, e as Server Actions do Next.js se comunicam com a API no servidor usando o `ADMIN_TOKEN`, que nunca é exposto ao navegador.

- Testes automatizados em banco real isolado: suíte com 42 testes no Vitest (`app.inject()`), que cria e migra automaticamente um banco `cafe_test` separado (com trava de segurança que impede rodar em bancos sem o sufixo _test), testando inclusive 8 requisições concorrentes para o mesmo dia.

## Como Executar o Projeto

### Pré-requisitos

- Node.js 20+ e pnpm 10+

- Docker (para subir o banco PostgreSQL)

### 1. Instalar as dependências

```bash
pnpm install
```

### 2. Subir o banco de dados PostgreSQL

```bash
docker compose up -d
```

(O container `cafe-db` expõe o PostgreSQL na porta 5433 para não conflitar com instalações locais na porta padrão 5432).

### 3. Configurar as variáveis de ambiente

Copie os arquivos `.env.example` da API e do Web para `.env`:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Preencha nos dois arquivos .env:

- Em `apps/api/.env`: defina um `ADMIN_TOKEN` com pelo menos 16 caracteres (ex.: `ADMIN_TOKEN="token-secreto-api-cafe-do-bairro"`).

- Em `apps/web/.env`: use o mesmo `ADMIN_TOKEN` da API e escolha uma senha simples em `ADMIN_PASSWORD` para entrar no painel `/admin` (ex.: `ADMIN_PASSWORD="cafe-da-marta"`).

### 4. Executar as migrações do Prisma

```bash
pnpm --filter api db:migrate
pnpm --filter api db:generate
```

### 5. Iniciar a API e o Front-end juntos

Na raiz do monorepo:

```bash
pnpm dev
```

- Landing Page: <http://localhost:3000>

- Painel da Dona Marta (`/admin`): <http://localhost:3000/admin>

- API Fastify: <http://localhost:3333> (`/saude` para healthcheck)

## Testes, Tipagem e Lint

Na raiz do projeto:

Rodar a suíte de 42 testes automatizados da API (cria e usa o banco `cafe_test`)

```bash
pnpm test
```

Verificar tipagem TypeScript em todos os pacotes (shared, api e web)

```bash
pnpm typecheck
```

Verificar formatação e lint com Biome

```bash
pnpm lint
```

## Documentação da API REST (`apps/api`)

Base URL padrão: <http://localhost:3333>

| Método | Rota                               | Acesso            | Descrição                                                                                             |
| ------ | ---------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
| GET    | `/saude`                           | Público           | Verifica status de saúde da API (`{ ok: true }`).                                                     |
| GET    | `/disponibilidade?data=AAAA-MM-DD` | Público           | Retorna total de vagas, ocupadas e disponíveis na data sem expor dados de clientes.                   |
| POST   | `/encomendas`                      | Público           | Cria uma nova encomenda (status inicial `RECEBIDA`). Retorna 409 se o dia já tiver 5 encomendas.      |
| GET    | `/encomendas?data=&status=`        | Restrito (Bearer) | Lista encomendas ordenadas por data de entrega, com filtros opcionais de data e status.               |
| PATCH  | `/encomendas/:id`                  | Restrito (Bearer) | Atualiza campos ou status (`RECEBIDA`, `PREPARO`, `ENTREGUE`). Valida limite diário caso a data mude. |
| DELETE | `/encomendas/:id`                  | Restrito (Bearer) | Remove uma encomenda (204 No Content).                                                                |

### Exemplo de criação de encomenda (`POST /encomendas`)

Corpo da requisição:

```json
{
  "cliente": "Maria Aparecida",
  "telefone": "(73) 99123-4567",
  "produto": "Bolo de cenoura com calda de chocolate",
  "dataEntrega": "2026-12-20"
}
```

Resposta (201 Created):

```json
{
  "id": 1,
  "cliente": "Maria Aparecida",
  "telefone": "73991234567",
  "produto": "Bolo de cenoura com calda de chocolate",
  "dataEntrega": "2026-12-20",
  "status": "RECEBIDA",
  "criadaEm": "2026-11-01T21:00:00.000Z"
}
```

## Licença

Distribuído sob a licença [MIT LICENSE](LICENSE).
