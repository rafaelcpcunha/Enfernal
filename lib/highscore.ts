/**
 * Recorde salvo no localStorage, exposto como store externa para
 * `useSyncExternalStore` (sem setState em efeitos, compatível com SSR).
 *
 * Boas práticas aplicadas (vercel-react-best-practices):
 *  - client-localstorage-schema: chave versionada, só um número, try/catch
 *  - js-cache-storage: leitura cacheada em memória, invalidada por outras abas
 */
const KEY = "enfernal:recorde:v1";
const listeners = new Set<() => void>();
let cache: number | null = null;

function read(): number {
  try {
    return Number(window.localStorage.getItem(KEY)) || 0;
  } catch {
    return 0; // modo privado / armazenamento bloqueado
  }
}

export function subscribeHighScore(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function getHighScore(): number {
  cache ??= read();
  return cache;
}

export function getServerHighScore(): number {
  return 0;
}

/** Salva se for recorde. Retorna true quando bateu o recorde anterior. */
export function submitScore(score: number): boolean {
  if (score <= getHighScore()) return false;
  cache = score;
  try {
    window.localStorage.setItem(KEY, String(score));
  } catch {
    // segue só com o cache em memória
  }
  listeners.forEach((l) => l());
  return true;
}
