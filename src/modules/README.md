# Módulos — Lógica de Negócio

Toda a lógica de negócio vive aqui, NUNCA nas rotas.
As rotas (src/app) apenas orquestram: recebem a requisição,
chamam um service, retornam a resposta.

## Anatomia de um módulo

```
modules/links/
├── links.schemas.ts     # Schemas Zod (validação de entrada/saída)
├── links.types.ts       # Tipos TypeScript derivados dos schemas
├── links.repository.ts  # Acesso ao banco (Prisma) — única camada que toca o DB
└── links.service.ts     # Regras de negócio — usa o repository
```

## Regras

1. Rotas não importam o Prisma diretamente. Sempre via service → repository.
2. Toda entrada externa (form, API, webhook) passa por um schema Zod.
3. Services não conhecem HTTP (nada de Request/Response) — recebem e
   devolvem objetos tipados. Isso permite testá-los isoladamente e,
   no futuro, mover módulos (ex: tracking) para workers dedicados.
