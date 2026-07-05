// Configuração central do produto.
// Tudo que é "marca" ou "regra global" vive aqui — nunca hardcoded nas páginas.

export const siteConfig = {
  name: "UTM SaaS", // TODO: definir o nome do produto
  defaultLocale: "pt" as const,
  locales: ["pt", "en"] as const,
  defaultTimezone: "America/Sao_Paulo",
  defaultCurrency: "BRL",
  // Comprimento do slug dos links de redirect (/r/[slug])
  slugLength: 7,
} as const;

export type Locale = (typeof siteConfig.locales)[number];
