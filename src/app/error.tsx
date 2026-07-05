"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 h-px w-10 bg-gold-400" aria-hidden />
        <p className="font-display text-2xl font-medium text-ink">
          Algo deu errado
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          Um erro inesperado aconteceu. Tente novamente.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex min-h-10 cursor-pointer items-center rounded-lg bg-forest-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-forest-600"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
