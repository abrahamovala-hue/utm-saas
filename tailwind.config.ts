import type { Config } from "tailwindcss";

// ============================================================
// DESIGN TOKENS — "Ateliê de dados"
// Toda cor do produto nasce aqui. Nenhum hex solto nas páginas.
// ============================================================

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Fundos
        porcelain: "#FAF8F5", // fundo geral — branco quente
        surface: "#FFFFFF", // cards e superfícies

        // Texto
        ink: {
          DEFAULT: "#1C1B1A", // grafite profundo
          soft: "#57534E", // texto secundário
          faint: "#8A857D", // legendas, labels
        },

        // Linhas e divisores
        line: "#E9E4DC",

        // Primário — verde-mata (confiança, receita)
        forest: {
          50: "#EDF4F0",
          100: "#D8E7DF",
          500: "#1E4D3B",
          600: "#173D2F",
          700: "#122F24",
        },

        // Acento — dourado-champanhe (assinatura da marca)
        gold: {
          100: "#F3EAD8",
          400: "#C9A96A",
          600: "#A98443",
        },

        // Negativo — vinho queimado (reembolsos, erros)
        wine: {
          50: "#F7ECEC",
          600: "#7A2E2E",
        },

        // Pendente
        amber: {
          50: "#F9F1DF",
          700: "#8A6215",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,27,26,0.04), 0 4px 16px rgba(28,27,26,0.04)",
        "card-hover":
          "0 2px 4px rgba(28,27,26,0.05), 0 8px 24px rgba(28,27,26,0.07)",
      },
    },
  },
  plugins: [],
};
export default config;
