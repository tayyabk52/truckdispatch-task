import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowBack } from "@mui/icons-material";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";

import { getTrip } from "@/api/trips";
import type { DailyLog, Trip } from "@/types/trip";
import LogSheetViewer from "@/components/trips/LogSheetViewer";
import { LoadingState, PageHeader, SectionCard } from "@/components/ui";
import { formatDate } from "@/lib/tripDisplay";

/**
 * Standalone view of all daily log sheets for a trip (linked from
 * /trips/:id/logs). Reuses the shared LogSheetViewer so the rendering and
 * download behavior match the results page exactly.
 */
export default function LogViewerPage() {
  const { id, date } = useParams<{ id: string; date?: string }>();
  const navigate = useNavigate();

  const {
    data: trip,
    isLoading,
    error,
  } = useQuery<Trip>({
    queryKey: ["trip", id],
    queryFn: () => getTrip(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingState fullHeight message="Loading log sheets…" />;

  if (error || !trip) {
    return (
      <Box sx={{ maxWidth: 600, mx: "auto" }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as any)?.message || "Trip not found."}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate("/plan")}>
          Plan a New Trip
        </Button>
      </Box>
    );
  }

  // If a specific date is requested, show only that log; else show all.
  const logs: DailyLog[] = date
    ? trip.daily_logs.filter((l) => l.log_date === date)
    : trip.daily_logs;

  return (
    <>
      <PageHeader
        title="Log Sheets"
        subtitle={`${trip.current_location_label.split(",")[0]} → ${trip.dropoff_label.split(",")[0]}`}
        actions={
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/trips/${trip.id}`)}
          >
            Back to Trip
          </Button>
        }
      />

      {logs.length === 0 ? (
        <Typography color="text.secondary">
          No log sheets available for this trip.
        </Typography>
      ) : (
        <Stack spacing={3}>
          {logs.map((log) => (
            <SectionCard
              key={log.id}
              title={`Day ${trip.daily_logs.indexOf(log) + 1} · ${formatDate(
                log.log_date + "T00:00"
              )}`}
            >
              <LogSheetViewer log={log} />
            </SectionCard>
          ))}
        </Stack>
      )}
    </>
  );
}
