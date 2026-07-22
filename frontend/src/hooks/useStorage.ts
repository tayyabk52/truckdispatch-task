import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { storage } from "@/storage";
import type {
  TripHistoryEntry,
  UserSettings,
} from "@/storage/types";
import { DEFAULT_SETTINGS } from "@/storage/types";

/**
 * React Query bindings over the active {@link storage} provider.
 *
 * Pages never touch the provider directly — they use these hooks, which
 * give them caching, loading/error state, and automatic invalidation.
 * Because the provider is async and swappable, moving from localStorage to
 * Supabase requires no changes here.
 */

const TRIPS_QUERY_KEY = ["storage", "trips"] as const;
const SETTINGS_QUERY_KEY = ["storage", "settings"] as const;

// -- Trip history -----------------------------------------------------------

export function useTripHistory() {
  return useQuery({
    queryKey: TRIPS_QUERY_KEY,
    queryFn: () => storage.listTrips(),
    staleTime: 30_000,
  });
}

export function useSaveTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: TripHistoryEntry) => storage.saveTrip(entry),
    onSuccess: () => qc.invalidateQueries({ queryKey: TRIPS_QUERY_KEY }),
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storage.deleteTrip(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TRIPS_QUERY_KEY }),
  });
}

export function useClearTrips() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => storage.clearTrips(),
    onSuccess: () => qc.invalidateQueries({ queryKey: TRIPS_QUERY_KEY }),
  });
}

// -- Settings ---------------------------------------------------------------

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => storage.getSettings(),
    // Settings are needed to prefill forms immediately; keep them fresh
    // but serve cached data instantly.
    staleTime: 60_000,
    initialData: DEFAULT_SETTINGS as UserSettings,
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: UserSettings) => storage.saveSettings(settings),
    onSuccess: (_data, settings) => {
      // Optimistically prime the cache so the UI reflects the save at once.
      qc.setQueryData(SETTINGS_QUERY_KEY, settings);
      qc.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
  });
}
