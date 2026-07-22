import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AccessTime,
  ArrowBack,
  CalendarToday,
  DirectionsCarFilled,
  LocalGasStation,
  Map as MapIcon,
  Route as RouteIcon,
  Speed,
  LocalShipping,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import { getTrip } from "@/api/trips";
import type { DailyLog, RouteStop, Trip } from "@/types/trip";
import TripMap from "@/components/TripMap";
import StopsList from "@/components/trips/StopsList";
import DailyLogPanel from "@/components/trips/DailyLogPanel";
import {
  LoadingState,
  SectionCard,
  StatCard,
} from "@/components/ui";
import { formatDateTime, formatDuration } from "@/lib/tripDisplay";

export default function TripResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [logTab, setLogTab] = useState(0);

  const {
    data: trip,
    isLoading,
    error,
  } = useQuery<Trip>({
    queryKey: ["trip", id],
    queryFn: () => getTrip(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <LoadingState fullHeight message="Calculating optimal compliant route & logs…" />;
  }

  if (error || !trip) {
    return (
      <Box sx={{ maxWidth: 500, mx: "auto", mt: 6, textAlign: "center" }}>
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {(error as any)?.message || "Trip not found."}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/plan")}
          sx={{ borderRadius: 2, px: 3, py: 1 }}
        >
          Plan a New Trip
        </Button>
      </Box>
    );
  }

  // --- Derived values (logic untouched) ---
  const fuelStops = trip.stops.filter((s: RouteStop) => s.stop_type === "fuel");
  const eta =
    trip.stops.length > 0
      ? trip.stops[trip.stops.length - 1].departure_time
      : null;

  const originName = trip.current_location_label.split(",")[0];
  const destName = trip.dropoff_label.split(",")[0];
  const routeTitle = `${originName} → ${destName}`;

  return (
    <Box sx={{ pb: 3 }}>
      {/* Flatter Hero Header Banner */}
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 2.5,
          borderRadius: 3,
          bgcolor: "#ffffff",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "none",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, mb: 2 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 0.75, flexWrap: "wrap" }}>
              <Chip
                label={`ID: ${id?.slice(0, 8).toUpperCase()}`}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: "0.68rem", height: 22, color: "text.secondary" }}
              />
            </Stack>

            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "text.primary",
                fontSize: { xs: "1.25rem", sm: "1.45rem" },
                mb: 0.25,
              }}
            >
              {routeTitle}
            </Typography>

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: "0.78rem" }}>
              Origin: <strong>{trip.current_location_label}</strong> &bull; Pickup: <strong>{trip.pickup_label}</strong> &bull; Drop-off: <strong>{trip.dropoff_label}</strong>
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", md: "auto" } }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBack />}
              onClick={() => navigate("/plan")}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                borderColor: "divider",
                color: "text.primary",
                fontSize: "0.8rem",
                textTransform: "none",
                flex: { xs: 1, md: "none" },
              }}
            >
              New Trip
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<LocalShipping />}
              onClick={() => setTab(1)}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                fontSize: "0.8rem",
                textTransform: "none",
                flex: { xs: 1, md: "none" },
              }}
            >
              View Logs ({trip.daily_logs.length})
            </Button>
          </Stack>
        </Stack>

        {/* Flatter Step Tracker */}
        <Box
          sx={{
            p: 1.5,
            px: { xs: 1.5, sm: 2 },
            borderRadius: 2,
            bgcolor: "#f8fafc",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
              gap: 1.5,
            }}
          >
            {/* Step 1 */}
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: "#16a34a",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                }}
              >
                1
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#16a34a", textTransform: "uppercase", fontSize: "0.625rem", display: "block" }}>
                  Origin
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.78rem", color: "text.primary" }} noWrap>
                  {originName}
                </Typography>
              </Box>
            </Stack>

            {/* Step 2 */}
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: "#2563eb",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                }}
              >
                2
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#2563eb", textTransform: "uppercase", fontSize: "0.625rem", display: "block" }}>
                  In Transit
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.78rem", color: "text.primary" }} noWrap>
                  {Math.round(trip.total_distance_miles || 0)} mi Route
                </Typography>
              </Box>
            </Stack>

            {/* Step 3 */}
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: "#ea580c",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                }}
              >
                3
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#ea580c", textTransform: "uppercase", fontSize: "0.625rem", display: "block" }}>
                  Fuel & Rest
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.78rem", color: "text.primary" }} noWrap>
                  {fuelStops.length} Fuel Stop{fuelStops.length !== 1 ? "s" : ""}
                </Typography>
              </Box>
            </Stack>

            {/* Step 4 */}
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: "#9333ea",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                }}
              >
                4
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#9333ea", textTransform: "uppercase", fontSize: "0.625rem", display: "block" }}>
                  Drop-Off ETA
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.78rem", color: "text.primary" }} noWrap>
                  {eta ? formatDateTime(eta) : "—"}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* KPI Row */}
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "1fr 1fr",
            sm: "repeat(3, 1fr)",
            lg: "repeat(6, 1fr)",
          },
          mb: 2.5,
        }}
      >
        <StatCard
          icon={<RouteIcon />}
          label="Distance"
          value={Math.round(trip.total_distance_miles || 0).toLocaleString()}
          unit="mi"
          color="#2563eb"
          help="Total driving distance from current location to drop-off."
        />
        <StatCard
          icon={<Speed />}
          label="Driving"
          value={formatDuration(trip.total_driving_minutes)}
          color="#16a34a"
          help="Time spent actually driving, excluding breaks and rests."
        />
        <StatCard
          icon={<AccessTime />}
          label="Trip Time"
          value={formatDuration(trip.total_trip_minutes)}
          color="#d97706"
          help="Total elapsed time including breaks, rests, fueling, and stops."
        />
        <StatCard
          icon={<CalendarToday />}
          label="Daily Logs"
          value={trip.daily_logs.length}
          color="#9333ea"
          help="Number of FMCSA daily log sheets this trip spans."
        />
        <StatCard
          icon={<LocalGasStation />}
          label="Fuel Stops"
          value={fuelStops.length}
          color="#ea580c"
          help="Planned fueling stops (one roughly every 1,000 miles)."
        />
        <StatCard
          icon={<DirectionsCarFilled />}
          label="ETA"
          value={eta ? formatDateTime(eta) : "—"}
          color="#0284c7"
          help="Estimated arrival at the drop-off location."
        />
      </Box>

      {/* Main Tab Switcher */}
      <Box sx={{ mb: 2.5 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 40,
            "& .MuiTabs-indicator": {
              height: 2.5,
              bgcolor: "primary.main",
            },
          }}
        >
          <Tab
            icon={<MapIcon style={{ fontSize: 16 }} />}
            iconPosition="start"
            label="Route & Map"
            sx={{ fontWeight: 600, fontSize: "0.875rem", textTransform: "none" }}
          />
          <Tab
            icon={<CalendarToday style={{ fontSize: 16 }} />}
            iconPosition="start"
            label={`ELD Daily Logs (${trip.daily_logs.length})`}
            sx={{ fontWeight: 600, fontSize: "0.875rem", textTransform: "none" }}
          />
        </Tabs>
      </Box>

      {/* Tab 0: Route & Map */}
      {tab === 0 && (
        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          }}
        >
          <SectionCard
            title="Interactive Route Map"
            icon={<MapIcon fontSize="small" />}
            help="Green = origin, blue = pickup, purple = drop-off. Other markers are required stops. Click any marker for details."
            disablePadding
          >
            <Box sx={{ height: { xs: 360, sm: 440, lg: 520 } }}>
              <TripMap trip={trip} />
            </Box>
          </SectionCard>

          <SectionCard
            title={`Route Stops (${trip.stops.length})`}
            icon={<RouteIcon fontSize="small" />}
            help="Every point along the route in order, with cumulative mileage and exact timing."
          >
            <StopsList stops={trip.stops} maxHeight={480} />
          </SectionCard>
        </Box>
      )}

      {/* Tab 1: Daily Logs */}
      {tab === 1 && (
        <SectionCard
          title="FMCSA Driver Daily Logs"
          icon={<CalendarToday fontSize="small" />}
          help="One FMCSA-style log sheet per day, with duty-status totals and a timeline. Download any sheet as an SVG."
        >
          {trip.daily_logs.length === 0 ? (
            <Typography color="text.secondary">
              No daily logs for this trip.
            </Typography>
          ) : (
            <>
              <Tabs
                value={logTab}
                onChange={(_, v) => setLogTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: "divider", mb: 2.5 }}
              >
                {trip.daily_logs.map((log: DailyLog, idx: number) => (
                  <Tab
                    key={log.id}
                    label={`Day ${idx + 1} &bull; ${new Date(
                      log.log_date + "T00:00"
                    ).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}`}
                    sx={{ fontWeight: 600, fontSize: "0.825rem", textTransform: "none" }}
                  />
                ))}
              </Tabs>

              {trip.daily_logs.map((log: DailyLog, idx: number) =>
                logTab === idx ? (
                  <DailyLogPanel key={log.id} log={log} trip={trip} />
                ) : null
              )}
            </>
          )}
        </SectionCard>
      )}

      {/* Flatter Quick Legend Footer */}
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{
          mt: 3,
          flexWrap: "wrap",
          p: 1.5,
          px: 2,
          borderRadius: 2,
          bgcolor: "#ffffff",
          border: "1px solid",
          borderColor: "divider",
          alignItems: "center",
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", mr: 1, textTransform: "uppercase", fontSize: "0.68rem" }}>
          Map Legend:
        </Typography>
        <Chip size="small" label="🟢 Origin" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.72rem", height: 22 }} />
        <Chip size="small" label="🔵 Pickup" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.72rem", height: 22 }} />
        <Chip size="small" label="🟣 Drop-off" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.72rem", height: 22 }} />
        <Chip size="small" label="⛽ Fuel" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.72rem", height: 22 }} />
        <Chip size="small" label="☕ Break" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.72rem", height: 22 }} />
        <Chip size="small" label="🛏️ Rest" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.72rem", height: 22 }} />
        <Chip size="small" label="🔄 Restart" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.72rem", height: 22 }} />
      </Stack>
    </Box>
  );
}

