# UTM SaaS

Plataforma de gerenciamento de UTMs, rastreamento de cliques, registro de
conversões e análise de campanhas de marketing.

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · PostgreSQL · Prisma

## Setup local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env
# Edite .env com sua DATABASE_URL (Supabase/Neon/local)

# 3. Criar as tabelas no banco
npx prisma migrate dev --name init

# 4. Rodar em desenvolvimento
npm run dev
```

Abra http://localhost:3000

## Comandos úteis

| Comando              | Descrição                                  |
|----------------------|--------------------------------------------|
| `npm run db:studio`  | Interface visual do banco (Prisma Studio)  |
| `npm run db:migrate` | Criar/aplicar migrações                    |
| `npm run lint`       | Verificar qualidade do código              |

## Estrutura

```
src/
├── app/          # Rotas Next.js (finas — só orquestram)
├── modules/      # Lógica de negócio (ver src/modules/README.md)
├── lib/          # Infra compartilhada (prisma, crypto, etc.)
├── components/   # UI compartilhada
└── config/       # Configuração central do produto
```

## Fases de desenvolvimento

- [x] **Fase 0** — Fundação: setup, schema do banco, estrutura modular
- [x] **Fase 1a** — Autenticação (Auth.js): registro, login, proteção de rotas
- [x] **Fase 1b** — CRUD de projetos + API keys
- [x] **Fase 2** — Links UTM + redirect `/r/[slug]` + registro de cliques
- [x] **Fase 3** — API pública de conversões: webhook Kiwify + API genérica (dedup + atribuição)
- [x] **Fase 4** — Dashboard e relatórios: métricas, gráfico diário, quebra por campanha
- [x] **Fase 5a** — Design premium "Ateliê de dados": tokens, tipografia Fraunces+Figtree, shell com sidebar
- [ ] **Fase 5b** — Polimento: rate limiting, onboarding
