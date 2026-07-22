import type { ReactNode } from "react";
import {
  AddRoad,
  CalendarMonth,
  DirectionsCar,
  RouteOutlined,
  Timeline,
} from "@mui/icons-material";
import { Box, Button, Divider, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import {
  EmptyState,
  InfoTooltip,
  LoadingState,
} from "@/components/ui";
import TripHistoryItem from "@/components/trips/TripHistoryItem";
import { useTripHistory } from "@/hooks/useStorage";
import { formatDuration } from "@/lib/tripDisplay";

const DASHBOARD_PURPLE = "#6d5ce7";

interface MetricTileProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  unit?: string;
  color: string;
  help: ReactNode;
}

function MetricTile({
  icon,
  label,
  value,
  unit,
  color,
  help,
}: MetricTileProps) {
  return (
    <Box
      sx={{
        height: "100%",
        minWidth: 0,
        p: { xs: 1.5, sm: 2 },
        border: "1px solid",
        borderColor: alpha(color, 0.14),
        borderRadius: 3,
        bgcolor: alpha(color, 0.035),
        boxShadow: "0 1px 2px rgba(60,64,67,0.04)",
      }}
    >
      <Stack direction="row" spacing={0.85} sx={{ alignItems: "center", mb: 1.25 }}>
        <Box
          sx={{
            width: { xs: 28, sm: 32 },
            height: { xs: 28, sm: 32 },
            borderRadius: 2.25,
            display: "grid",
            placeItems: "center",
            bgcolor: alpha(color, 0.12),
            color,
            flexShrink: 0,
            "& svg": { fontSize: { xs: 16, sm: 17 } },
          }}
        >
          {icon}
        </Box>
        <Stack direction="row" spacing={0.35} sx={{ minWidth: 0, alignItems: "center" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{
              fontWeight: 700,
              letterSpacing: { xs: "0.03em", sm: "0.045em" },
              textTransform: "uppercase",
              fontSize: { xs: "0.62rem", sm: "0.72rem" },
            }}
          >
            {label}
          </Typography>
          <InfoTooltip title={help} size={13} />
        </Stack>
      </Stack>
      <Typography
        variant="h5"
        noWrap
        sx={{
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          fontSize: { xs: "1.2rem", sm: "1.5rem" },
        }}
      >
        {value}
        {unit && (
          <Typography
            component="span"
            variant="body2"
            color="text.secondary"
            sx={{ ml: 0.4, fontWeight: 600, letterSpacing: 0, fontSize: { xs: "0.72rem", sm: "0.875rem" } }}
          >
            {unit}
          </Typography>
        )}
      </Typography>
    </Box>
  );
}

function SnapshotRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, textAlign: "right" }}>
        {value}
      </Typography>
    </Stack>
  );
}

/**
 * Dashboard overview. It keeps the saved-trip calculations and navigation
 * unchanged while presenting them as a calmer, more scannable dispatch desk.
 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: trips = [], isLoading } = useTripHistory();

  const totalTrips = trips.length;
  const totalMiles = trips.reduce(
    (sum, t) => sum + (t.totalDistanceMiles ?? 0),
    0
  );
  const totalDrivingMinutes = trips.reduce(
    (sum, t) => sum + (t.totalDrivingMinutes ?? 0),
    0
  );
  const totalLogs = trips.reduce((sum, t) => sum + (t.dailyLogCount ?? 0), 0);

  const recent = trips.slice(0, 5);

  return (
    <Box sx={{ pb: 1 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.65fr) minmax(320px, 0.95fr)" },
          gap: { xs: 2, md: 2.5, xl: 3 },
          alignItems: "start",
        }}
      >
        <Stack spacing={{ xs: 2, md: 2.5 }}>
          <Paper
            component="section"
            aria-labelledby="dashboard-title"
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              minHeight: { xs: 240, sm: 256 },
              px: { xs: 2.25, sm: 3, md: 3.5 },
              py: { xs: 2.5, sm: 3 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              bgcolor: alpha(DASHBOARD_PURPLE, 0.08),
              color: "text.primary",
              borderRadius: 4,
              border: "1px solid",
              borderColor: alpha(DASHBOARD_PURPLE, 0.16),
              boxShadow: `0 10px 24px ${alpha(DASHBOARD_PURPLE, 0.08)}`,
            }}
          >
            <Box aria-hidden sx={{ position: "absolute", inset: 0, opacity: 0.75, pointerEvents: "none" }}>
              <Box
                sx={{
                  position: "absolute",
                  width: { xs: "72%", sm: "66%" },
                  height: 1,
                  bgcolor: alpha(DASHBOARD_PURPLE, 0.18),
                  top: { xs: "23%", sm: "24%" },
                  right: { xs: "-10%", sm: "-8%" },
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  width: 12,
                  height: 12,
                  border: "2px solid",
                  borderColor: alpha(DASHBOARD_PURPLE, 0.3),
                  borderRadius: "50%",
                  bgcolor: "background.paper",
                  top: { xs: "calc(23% - 6px)", sm: "calc(24% - 6px)" },
                  right: { xs: "18%", sm: "22%" },
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  width: 18,
                  height: 18,
                  borderRadius: 2,
                  bgcolor: alpha(DASHBOARD_PURPLE, 0.16),
                  transform: "rotate(45deg)",
                  top: { xs: "calc(23% - 9px)", sm: "calc(24% - 9px)" },
                  right: { xs: "34%", sm: "36%" },
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  width: 210,
                  height: 210,
                  border: "1px solid",
                  borderColor: alpha(DASHBOARD_PURPLE, 0.12),
                  borderRadius: "50%",
                  right: { xs: -78, sm: -66 },
                  bottom: { xs: -118, sm: -106 },
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  width: 82,
                  height: 82,
                  border: "1px solid",
                  borderColor: alpha(DASHBOARD_PURPLE, 0.12),
                  borderRadius: "50%",
                  right: { xs: 18, sm: 28 },
                  top: { xs: -30, sm: -34 },
                }}
              />
            </Box>

            <Stack spacing={2.5} sx={{ position: "relative", maxWidth: 640 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  color: alpha(DASHBOARD_PURPLE, 0.9),
                }}
              >
                DISPATCH OVERVIEW
              </Typography>
              <Stack direction="row" spacing={0.7} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Typography
                  id="dashboard-title"
                  component="h1"
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: { xs: "-0.03em", sm: "-0.045em" },
                    lineHeight: 1.02,
                    fontSize: { xs: "1.85rem", sm: "2.4rem", md: "3rem" },
                    maxWidth: { xs: 280, sm: 520 },
                  }}
                >
                  Clean trip stats at a glance.
                </Typography>
                <InfoTooltip
                  title="This overview summarizes every trip you've planned on this device. Sign-in sync keeps it per-driver in production."
                  size={17}
                />
              </Stack>
              <Typography
                sx={{
                  maxWidth: 520,
                  color: "text.secondary",
                  fontSize: { xs: "0.95rem", sm: "1rem" },
                  lineHeight: 1.6,
                }}
              >
                Review recent routes, keep the totals visible, and start the next compliant plan when you’re ready.
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ alignItems: { sm: "center" } }}
              >
                <Button
                  variant="contained"
                  startIcon={<AddRoad />}
                  onClick={() => navigate("/plan")}
                  sx={{
                    alignSelf: { xs: "stretch", sm: "flex-start" },
                    minWidth: { sm: 160 },
                  }}
                >
                  Plan trip
                </Button>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ maxWidth: 380, lineHeight: 1.5 }}
                >
                  {totalTrips > 0
                    ? `${totalTrips} saved trips are ready for review.`
                    : "No saved trips yet. Start your first plan to populate the dashboard."}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          <Box
            component="section"
            aria-label="Trip totals"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
              gap: { xs: 1.25, sm: 1.5 },
            }}
          >
            <MetricTile icon={<RouteOutlined />} label="Trips" value={totalTrips} color="#1a73e8" help="How many trips you've planned." />
            <MetricTile icon={<DirectionsCar />} label="Miles" value={Math.round(totalMiles).toLocaleString()} unit="mi" color="#188038" help="Sum of the driving distance across all your trips." />
            <MetricTile icon={<Timeline />} label="Drive time" value={formatDuration(totalDrivingMinutes)} color="#f9ab00" help="Total behind-the-wheel time across all trips." />
            <MetricTile icon={<CalendarMonth />} label="Daily logs" value={totalLogs} color="#8430ce" help="Total FMCSA daily log sheets generated." />
          </Box>

        </Stack>

        <Paper
          component="aside"
          aria-label="Trip summary"
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3, md: 3.5 },
            border: "1px solid",
            borderColor: alpha(DASHBOARD_PURPLE, 0.16),
            borderRadius: 4,
            bgcolor: "background.paper",
            boxShadow: "0 1px 2px rgba(60,64,67,0.05)",
          }}
        >
          <Stack spacing={{ xs: 2, sm: 2.75 }}>
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.12em", lineHeight: 1, fontSize: { xs: "0.62rem", sm: "0.72rem" } }}>
                AT A GLANCE
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.6, fontWeight: 700, letterSpacing: "-0.02em", fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                Trip summary
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, lineHeight: 1.5, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                A compact roll-up that keeps the important totals visible without crowding the page.
              </Typography>
            </Box>

            <Stack spacing={{ xs: 1.4, sm: 1.75 }} divider={<Divider flexItem />}>
              <SnapshotRow label="Saved trips" value={totalTrips} />
              <SnapshotRow label="Distance planned" value={`${Math.round(totalMiles).toLocaleString()} mi`} />
              <SnapshotRow label="Driving time" value={formatDuration(totalDrivingMinutes)} />
              <SnapshotRow label="ELD log sheets" value={totalLogs} />
            </Stack>

            <Box
              sx={{
                pt: 2.25,
                borderTop: "1px solid",
                borderColor: alpha(DASHBOARD_PURPLE, 0.14),
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.5 }}>
                The main action stays in the hero, so this rail stays quiet and readable.
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>

      <Paper
        component="section"
        elevation={0}
        sx={{
          mt: { xs: 2.5, sm: 3 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 4,
          overflow: "hidden",
          bgcolor: "background.paper",
          boxShadow: "0 1px 2px rgba(60,64,67,0.04)",
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 2, sm: 3, md: 3.5 },
            py: { xs: 1.6, sm: 2 },
            gap: 1.5,
          }}
        >
          <Box>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 700, letterSpacing: "-0.02em", fontSize: { xs: "1rem", sm: "1.25rem" } }}>
              Recent trips
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.62rem", sm: "0.72rem" } }}>
              Your latest saved route plans
            </Typography>
          </Box>
          {totalTrips > 0 && (
            <Button size="small" onClick={() => navigate("/history")}>
              View all
            </Button>
          )}
        </Stack>
        <Divider />
        {isLoading ? (
          <LoadingState message="Loading your trips…" />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={<RouteOutlined />}
            title="No trips yet"
            description="Plan your first trip to generate a compliant route and ELD daily logs. It'll show up here."
            action={
              <Button variant="contained" startIcon={<AddRoad />} onClick={() => navigate("/plan")}>
                Plan your first trip
              </Button>
            }
          />
        ) : (
          <Stack divider={<Divider flexItem />}>
            {recent.map((entry) => (
              <TripHistoryItem key={entry.id} entry={entry} />
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
