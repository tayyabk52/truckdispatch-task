import { LocalStorageProvider } from "./localStorageProvider";
import { SupabaseStorageProvider } from "./supabaseProvider";
import type { StorageProvider } from "./types";

/**
 * Storage provider factory.
 *
 * Selects the persistence backend at runtime from an env flag so the same
 * code runs against localStorage in development and Supabase in
 * production. Defaults to localStorage, which always works and needs no
 * configuration.
 *
 *   VITE_STORAGE_PROVIDER=local     (default)
 *   VITE_STORAGE_PROVIDER=supabase  (requires Supabase wiring — see
 *                                    supabaseProvider.ts)
 */
function createStorageProvider(): StorageProvider {
  const choice = (
    import.meta.env.VITE_STORAGE_PROVIDER || "local"
  ).toLowerCase();

  if (choice === "supabase") {
    try {
      return new SupabaseStorageProvider();
    } catch (err) {
      // If Supabase isn't configured yet, don't take the app down —
      // fall back to local so the UI keeps functioning.
      console.warn(
        "[storage] Supabase provider unavailable, falling back to localStorage.",
        err
      );
      return new LocalStorageProvider();
    }
  }

  return new LocalStorageProvider();
}

/** Singleton provider used across the app. */
export const storage: StorageProvider = createStorageProvider();

export * from "./types";
