const RETRY_KEY = "sestran:chunk-recovery";
const RETRY_INTERVAL = 60_000;
let installed = false;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk .+ failed/i.test(message);
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