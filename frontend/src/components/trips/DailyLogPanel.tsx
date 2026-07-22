import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { DailyLog, Trip } from "@/types/trip";
import { DUTY_META } from "@/lib/tripDisplay";
import DutyTimeline from "./DutyTimeline";
import LogSheetViewer from "./LogSheetViewer";

function HoursChip({
  label,
  hours,
  color,
}: {
  label: string;
  hours: number | string;
  color: string;
}) {
  const numHours = typeof hours === "string" ? parseFloat(hours) : hours;
  return (
    <Box
      sx={{
        borderRadius: 2,
        p: 1.25,
        textAlign: "center",
        bgcolor: "#ffffff",
        border: "1px solid",
        borderColor: "divider",
        transition: "border-color 0.15s ease",
        "&:hover": {
          borderColor: alpha(color, 0.4),
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          fontSize: "0.625rem",
          display: "block",
          mb: 0.15,
        }}
        noWrap
      >
        {label}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color, lineHeight: 1.1, fontSize: "1.05rem" }}>
        {numHours.toFixed(1)}
        <Typography component="span" variant="caption" sx={{ ml: 0.25, fontWeight: 600, fontSize: "0.7rem", opacity: 0.8 }}>
          h
        </Typography>
      </Typography>
    </Box>
  );
}

interface DailyLogPanelProps {
  log: DailyLog;
  trip: Trip;
}

/**
 * A single day's summary: totals by duty status, the rendered log sheet,
 * and the duty-status timeline for that date.
 *
 * The per-day event filtering and totals math are preserved verbatim from
 * the original TripResultsPage so the numbers never change.
 */
export default function DailyLogPanel({ log, trip }: DailyLogPanelProps) {
  const total =
    parseFloat(String(log.total_off_duty)) +
    parseFloat(String(log.total_sleeper_berth)) +
    parseFloat(String(log.total_driving)) +
    parseFloat(String(log.total_on_duty_not_driving));

  const dayEvents = trip.duty_events.filter((e) => {
    const eventDate = new Date(e.start_time).toISOString().split("T")[0];
    return eventDate === log.log_date;
  });

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" },
        }}
      >
        <HoursChip
          label="Off Duty"
          hours={log.total_off_duty}
          color={DUTY_META.off_duty.color}
        />
        <HoursChip
          label="Sleeper Berth"
          hours={log.total_sleeper_berth}
          color={DUTY_META.sleeper_berth.color}
        />
        <HoursChip
          label="Driving"
          hours={log.total_driving}
          color={DUTY_META.driving.color}
        />
        <HoursChip
          label="On Duty (ND)"
          hours={log.total_on_duty_not_driving}
          color={DUTY_META.on_duty_not_driving.color}
        />
        <HoursChip label="Total Hours" hours={total} color="#374151" />
      </Box>

      <Box
        sx={{
          p: 1.25,
          px: 1.75,
          borderRadius: 2,
          bgcolor: "#ffffff",
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.825rem" }}>
          🚛 Miles Driven Today:{" "}
          <strong style={{ color: "#1a73e8", fontSize: "0.9rem" }}>
            {Math.round(log.total_miles_driving_today)} mi
          </strong>
        </Typography>
        {log.shipping_doc_number && (
          <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.75rem" }}>
            BOL / Shipping Doc: {log.shipping_doc_number}
          </Typography>
        )}
      </Box>

      <LogSheetViewer log={log} />

      <DutyTimeline events={dayEvents} />
    </Stack>
  );
}


