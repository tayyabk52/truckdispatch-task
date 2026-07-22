import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { RouteStop } from "@/types/trip";
import { formatDateTime, stopMeta } from "@/lib/tripDisplay";

interface StopsListProps {
  stops: RouteStop[];
  maxHeight?: number | string;
}

/**
 * Clean, un-cluttered vertical timeline of stops.
 * Uses clean inline typography, subtle dot separators, and lightweight borders instead of clunky background pills.
 */
export default function StopsList({ stops, maxHeight = 500 }: StopsListProps) {
  return (
    <Stack sx={{ maxHeight, overflowY: "auto", pr: 0.5 }}>
      {stops.map((stop, idx) => {
        const meta = stopMeta(stop.stop_type);
        const isLast = idx === stops.length - 1;

        return (
          <Stack
            key={stop.id}
            direction="row"
            spacing={1.5}
            sx={{ position: "relative" }}
          >
            {/* Timeline Rail & Marker Node */}
            <Stack sx={{ width: 20, flexShrink: 0, alignItems: "center" }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  mt: 0.85,
                  borderRadius: "50%",
                  bgcolor: meta.color,
                  border: "2px solid #ffffff",
                  boxShadow: `0 0 0 1px ${alpha(meta.color, 0.4)}`,
                  zIndex: 2,
                }}
              />
              {!isLast && (
                <Box
                  sx={{
                    flex: 1,
                    width: 1.5,
                    bgcolor: alpha(meta.color, 0.2),
                    my: 0.25,
                    minHeight: 32,
                  }}
                />
              )}
            </Stack>

            {/* Clean Flat Content Card */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                mb: isLast ? 0 : 1.75,
                pb: isLast ? 0 : 1.75,
                borderBottom: isLast ? "none" : "1px solid",
                borderColor: "divider",
              }}
            >
              {/* Top Meta Line: Status Label & Mileage */}
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", justifyContent: "space-between", mb: 0.35 }}
              >
                <Stack direction="row" spacing={0.6} sx={{ alignItems: "center" }}>
                  <span style={{ fontSize: 12, lineHeight: 1 }}>{meta.emoji}</span>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: meta.color,
                      fontSize: "0.72rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    {meta.label}
                  </Typography>
                </Stack>

                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.72rem",
                    color: "text.secondary",
                  }}
                >
                  Mi {Math.round(stop.cumulative_miles)}
                </Typography>
              </Stack>

              {/* Location Name */}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  fontSize: "0.835rem",
                  lineHeight: 1.3,
                  mb: 0.5,
                }}
              >
                {stop.label}
              </Typography>

              {/* Timing Info Row */}
              <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.74rem" }}>
                  {formatDateTime(stop.arrival_time)}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.74rem" }}>
                  •
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: meta.color, fontSize: "0.74rem" }}>
                  {stop.duration_minutes} min duration
                </Typography>
              </Stack>

              {/* Notes Callout */}
              {stop.notes && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 0.5,
                    color: "text.secondary",
                    fontSize: "0.72rem",
                    fontStyle: "italic",
                  }}
                >
                  Note: {stop.notes}
                </Typography>
              )}
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}




