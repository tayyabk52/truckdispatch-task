import type {
  StorageProvider,
  TripHistoryEntry,
  UserSettings,
} from "./types";

/**
 * Supabase-backed provider (production, per-driver records).
 *
 * This is a scaffold. It documents the exact shape a Supabase
 * implementation needs so that switching from local to cloud storage is a
 * one-line change in {@link ./index.ts} once the Supabase client and
 * tables exist — no page code changes.
 *
 * Suggested schema (RLS keyed on auth.uid()):
 *
 *   table trip_history (
 *     id            uuid primary key,          -- backend Trip id
 *     user_id       uuid references auth.users default auth.uid(),
 *     origin_label  text,
 *     pickup_label  text,
 *     dropoff_label text,
 *     total_distance_miles  numeric,
 *     total_driving_minutes integer,
 *     daily_log_count       integer,
 *     planned_at    timestamptz default now()
 *   );
 *
 *   table user_settings (
 *     user_id     uuid primary key default auth.uid(),
 *     defaults    jsonb,
 *     preferences jsonb
 *   );
 *
 * To activate:
 *   1. `npm i @supabase/supabase-js`
 *   2. Create `src/storage/supabaseClient.ts` exporting a configured client.
 *   3. Implement the methods below using that client.
 *   4. Set VITE_STORAGE_PROVIDER=supabase (see index.ts).
 */
export class SupabaseStorageProvider implements StorageProvider {
  readonly name = "supabase";

  // The real client would be injected in the constructor, e.g.:
  //   constructor(private readonly db: SupabaseClient) {}

  private notImplemented(): never {
    throw new Error(
      "SupabaseStorageProvider is not yet wired up. Install " +
        "@supabase/supabase-js, implement the methods, and set " +
        "VITE_STORAGE_PROVIDER=supabase."
    );
  }

  async listTrips(): Promise<TripHistoryEntry[]> {
    // return (await this.db.from("trip_history").select("*")
    //   .order("planned_at", { ascending: false })).data ?? []
    this.notImplemented();
  }

  async saveTrip(_entry: TripHistoryEntry): Promise<void> {
    // await this.db.from("trip_history").upsert(toRow(_entry))
    this.notImplemented();
  }

  async deleteTrip(_id: string): Promise<void> {
    // await this.db.from("trip_history").delete().eq("id", _id)
    this.notImplemented();
  }

  async clearTrips(): Promise<void> {
    // await this.db.from("trip_history").delete().eq("user_id", uid)
    this.notImplemented();
  }

  async getSettings(): Promise<UserSettings> {
    // const { data } = await this.db.from("user_settings").select("*").single()
    this.notImplemented();
  }

  async saveSettings(_settings: UserSettings): Promise<void> {
    // await this.db.from("user_settings").upsert({ ..._settings })
    this.notImplemented();
  }
}
