/**
 * Storage domain types.
 *
 * These describe the *app-level* data we persist for each driver: their
 * saved trip history and their personal defaults/settings. They are
 * intentionally decoupled from the API `Trip` shape so the persistence
 * layer can evolve (localStorage today, Supabase in production) without
 * touching page code.
 */

/** A lightweight record of a planned trip, saved locally for quick recall. */
export interface TripHistoryEntry {
  /** Trip UUID from the backend — used to re-open full results. */
  id: string;
  originLabel: string;
  pickupLabel: string;
  dropoffLabel: string;
  totalDistanceMiles: number | null;
  totalDrivingMinutes: number | null;
  dailyLogCount: number;
  /** ISO timestamp of when this trip was planned. */
  plannedAt: string;
}

/** Driver / carrier / vehicle defaults used to prefill the Plan Trip form. */
export interface DriverDefaults {
  driver_name: string;
  co_driver: string;
  carrier_name: string;
  main_office: string;
  truck_number: string;
  trailer_number: string;
}

/** App preferences that are not trip-specific. */
export interface AppPreferences {
  /** Default value for the cycle-hours field on a fresh form. */
  default_cycle_used_hours: number;
  /** Distance unit for display. Backend always returns miles. */
  distance_unit: "mi" | "km";
}

export interface UserSettings {
  defaults: DriverDefaults;
  preferences: AppPreferences;
}

export const EMPTY_DRIVER_DEFAULTS: DriverDefaults = {
  driver_name: "",
  co_driver: "",
  carrier_name: "",
  main_office: "",
  truck_number: "",
  trailer_number: "",
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  default_cycle_used_hours: 0,
  distance_unit: "mi",
};

export const DEFAULT_SETTINGS: UserSettings = {
  defaults: EMPTY_DRIVER_DEFAULTS,
  preferences: DEFAULT_PREFERENCES,
};

/**
 * The contract every storage backend must implement.
 *
 * All methods are async so that a remote backend (Supabase) is a
 * drop-in replacement for the local one — callers already `await`.
 */
export interface StorageProvider {
  /** Stable identifier, useful for debugging / telemetry. */
  readonly name: string;

  // Trip history
  listTrips(): Promise<TripHistoryEntry[]>;
  saveTrip(entry: TripHistoryEntry): Promise<void>;
  deleteTrip(id: string): Promise<void>;
  clearTrips(): Promise<void>;

  // Settings
  getSettings(): Promise<UserSettings>;
  saveSettings(settings: UserSettings): Promise<void>;
}
