// ============================================================
// Rate limiting em memória — janela deslizante por identificador.
//
// LIMITAÇÃO CONHECIDA (documentada de propósito): em ambiente
// serverless cada instância tem sua própria memória, então o
// limite real pode ser um múltiplo do configurado. Ainda assim
// barra rajadas de abuso por instância. Quando o produto escalar,
// trocamos por Redis (Upstash) SEM mudar a interface desta função.
// ============================================================

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

// Limpeza periódica para não acumular memória
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL) {
    lastCleanup = now;
    buckets.forEach((bucket, key) => {
      bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
      if (bucket.timestamps.length === 0) buckets.delete(key);
    });
  }

  const bucket = buckets.get(identifier) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    buckets.set(identifier, bucket);
    return { allowed: false, remaining: 0 };
  }

  bucket.timestamps.push(now);
  buckets.set(identifier, bucket);
  return { allowed: true, remaining: limit - bucket.timestamps.length };
}
