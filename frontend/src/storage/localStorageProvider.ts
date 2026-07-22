import {
  DEFAULT_SETTINGS,
  type StorageProvider,
  type TripHistoryEntry,
  type UserSettings,
} from "./types";

/**
 * Browser localStorage implementation of {@link StorageProvider}.
 *
 * Used for local development and as an offline fallback. Keys are
 * namespaced so multiple apps on the same origin don't collide. All reads
 * are defensive: corrupt or absent data resolves to sensible defaults
 * rather than throwing.
 */

const TRIPS_KEY = "truckdispatch.trips.v1";
const SETTINGS_KEY = "truckdispatch.settings.v1";
const MAX_TRIPS = 100;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled — fail silently; the app
    // continues to work, it just won't remember this data.
  }
}

export class LocalStorageProvider implements StorageProvider {
  readonly name = "localStorage";

  async listTrips(): Promise<TripHistoryEntry[]> {
    const trips = readJSON<TripHistoryEntry[]>(TRIPS_KEY, []);
    // Newest first.
    return [...trips].sort(
      (a, b) =>
        new Date(b.plannedAt).getTime() - new Date(a.plannedAt).getTime()
    );
  }

  async saveTrip(entry: TripHistoryEntry): Promise<void> {
    const trips = readJSON<TripHistoryEntry[]>(TRIPS_KEY, []);
    // De-dupe by id (re-opening a trip shouldn't create duplicates).
    const next = [entry, ...trips.filter((t) => t.id !== entry.id)].slice(
      0,
      MAX_TRIPS
    );
    writeJSON(TRIPS_KEY, next);
  }

  async deleteTrip(id: string): Promise<void> {
    const trips = readJSON<TripHistoryEntry[]>(TRIPS_KEY, []);
    writeJSON(
      TRIPS_KEY,
      trips.filter((t) => t.id !== id)
    );
  }

  async clearTrips(): Promise<void> {
    writeJSON(TRIPS_KEY, []);
  }

  async getSettings(): Promise<UserSettings> {
    const stored = readJSON<Partial<UserSettings>>(SETTINGS_KEY, {});
    // Merge with defaults so newly-added fields are always present.
    return {
      defaults: { ...DEFAULT_SETTINGS.defaults, ...stored.defaults },
      preferences: {
        ...DEFAULT_SETTINGS.preferences,
        ...stored.preferences,
      },
    };
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    writeJSON(SETTINGS_KEY, settings);
  }
}
