const RETRY_KEY = "sestran:chunk-recovery";
const RETRY_INTERVAL = 60_000;
let installed = false;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const staleImport = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk .+ failed/i.test(message);
  // A calendar discovered by Vite after startup can retain a different React
  // optimizer generation in an already-open document. Only recover this known
  // dev asset mismatch, not arbitrary application hook errors.
  const stack = error instanceof Error ? error.stack ?? "" : "";
  const staleCalendarReact = /Cannot read properties of null \(reading 'useMemo'\)/.test(message)
    && /DayPicker/.test(stack) && /\/node_modules\/\.vite\/deps\/react(?:\.js|[-_])/.test(stack);
  return staleImport || staleCalendarReact;
}

// A fresh document resolves current asset hashes; retrying the rejected import does not.
export function recoverChunkLoad(error: unknown): boolean {
  if (typeof window === "undefined" || !isChunkLoadError(error)) return false;
  try {
    const previous = Number(window.sessionStorage.getItem(RETRY_KEY));
    if (previous && Date.now() - previous < RETRY_INTERVAL) return false;
    window.sessionStorage.setItem(RETRY_KEY, String(Date.now()));
  } catch {
    // Without a persistent guard, automatic reloads could loop indefinitely.
    return false;
  }
  window.location.reload();
  return true;
}

export function installChunkRecovery() {
  if (typeof window === "undefined" || installed) return;
  installed = true;
  window.addEventListener("vite:preloadError", (event) => {
    const error = (event as Event & { payload?: unknown }).payload;
    if (recoverChunkLoad(error)) event.preventDefault();
  });
  window.addEventListener("unhandledrejection", (event) => {
    if (recoverChunkLoad(event.reason)) event.preventDefault();
  });
}