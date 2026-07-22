import type { DutyStatus, StopType } from "@/types/trip";
import { BRAND_COLORS, DUTY_STATUS_COLORS } from "@/theme";

/**
 * Single source of truth for trip domain display metadata: stop types and
 * duty statuses, their labels, colors, and emoji. Previously duplicated
 * across the results page and the map — now shared.
 */

export interface StopMeta {
  label: string;
  emoji: string;
  color: string;
}

export const STOP_META: Record<StopType, StopMeta> = {
  origin: { label: "Origin", emoji: "🟢", color: BRAND_COLORS.green },
  pickup: { label: "Pickup", emoji: "🔵", color: BRAND_COLORS.blue },
  dropoff: { label: "Drop-off", emoji: "🟣", color: BRAND_COLORS.purple },
  fuel: { label: "Fuel Stop", emoji: "⛽", color: BRAND_COLORS.amber },
  break_30min: { label: "30-min Break", emoji: "☕", color: "#eab308" },
  rest_10hr: { label: "10-hr Rest", emoji: "🛏️", color: BRAND_COLORS.red },
  restart_34hr: { label: "34-hr Restart", emoji: "🔄", color: "#c5221f" },
  post_trip: { label: "Post-trip", emoji: "⏹️", color: BRAND_COLORS.inkSoft },
};

export function stopMeta(type: string): StopMeta {
  return (
    STOP_META[type as StopType] ?? {
      label: type,
      emoji: "📍",
      color: BRAND_COLORS.inkSoft,
    }
  );
}

export interface DutyMeta {
  label: string;
  color: string;
}

export const DUTY_META: Record<DutyStatus, DutyMeta> = {
  off_duty: { label: "Off Duty", color: DUTY_STATUS_COLORS.off_duty },
  sleeper_berth: {
    label: "Sleeper Berth",
    color: DUTY_STATUS_COLORS.sleeper_berth,
  },
  driving: { label: "Driving", color: DUTY_STATUS_COLORS.driving },
  on_duty_not_driving: {
    label: "On Duty (Not Driving)",
    color: DUTY_STATUS_COLORS.on_duty_not_driving,
  },
};

export function dutyMeta(status: string): DutyMeta {
  return (
    DUTY_META[status as DutyStatus] ?? {
      label: status,
      color: BRAND_COLORS.inkSoft,
    }
  );
}

// -- Formatters -------------------------------------------------------------

/** "1h 30m" / "45m" / "—" from a minute count. */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

/** "Apr 5, 2:30 PM" from an ISO string. */
export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "Apr 5, 2025" from an ISO string or date-only string. */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** "2:30 PM" from an ISO string. */
export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
