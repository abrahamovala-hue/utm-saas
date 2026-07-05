// Layout das páginas de autenticação — primeira impressão do produto.
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 h-px w-10 bg-gold-400" aria-hidden />
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink">
            UTM SaaS
          </h1>
          <p className="mt-2 text-sm text-ink-faint">
            Cada venda com origem conhecida
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-8 shadow-card">
          {children}
        </div>
      </div>
    </main>
  );
}
