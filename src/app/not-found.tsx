import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 h-px w-10 bg-gold-400" aria-hidden />
        <p className="font-display text-5xl font-medium text-ink">404</p>
        <p className="mt-3 text-sm text-ink-soft">
          Esta página não existe ou foi movida.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex min-h-10 items-center rounded-lg bg-forest-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-forest-600"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
