import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AddRoad,
  DeleteSweep,
  HistoryToggleOff,
  Search,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { EmptyState, LoadingState, SectionCard } from "@/components/ui";
import TripHistoryTable from "@/components/trips/TripHistoryTable";
import {
  useClearTrips,
  useDeleteTrip,
  useTripHistory,
} from "@/hooks/useStorage";

/**
 * Full list of previously-planned trips, shown as a sortable data table.
 * Each row links back to the live trip results. Trips can be removed
 * individually or cleared entirely, and filtered by a text search.
 */
export default function HistoryPage() {
  const navigate = useNavigate();
  const { data: trips = [], isLoading } = useTripHistory();
  const deleteTrip = useDeleteTrip();
  const clearTrips = useClearTrips();
  const [confirmClear, setConfirmClear] = useState(false);
  const [query, setQuery] = useState("");

  const handleClear = () => {
    clearTrips.mutate();
    setConfirmClear(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter((t) =>
      [t.originLabel, t.pickupLabel, t.dropoffLabel]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [trips, query]);

  return (
    <Box sx={{ pb: 3 }}>
      {/* Top Banner Header */}
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
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
        >
          <Box>
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
              Trip History
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: "0.78rem" }}>
              Saved route plans and generated ELD daily logs on this device
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.25}>
            {trips.length > 0 && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteSweep />}
                onClick={() => setConfirmClear(true)}
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  textTransform: "none",
                  height: 34,
                }}
              >
                Clear History
              </Button>
            )}
            <Button
              size="small"
              variant="contained"
              startIcon={<AddRoad />}
              onClick={() => navigate("/plan")}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                fontSize: "0.8rem",
                textTransform: "none",
                height: 34,
              }}
            >
              Plan New Trip
            </Button>
          </Stack>
        </Stack>
      </Box>

      {isLoading ? (
        <SectionCard disablePadding>
          <LoadingState message="Loading your trip history…" />
        </SectionCard>
      ) : trips.length === 0 ? (
        <SectionCard disablePadding>
          <EmptyState
            icon={<HistoryToggleOff />}
            title="No saved trips in your history"
            description="Every trip route you calculate is stored here locally for quick reference."
            action={
              <Button
                variant="contained"
                size="small"
                startIcon={<AddRoad />}
                onClick={() => navigate("/plan")}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                Plan a Trip Now
              </Button>
            }
          />
        </SectionCard>
      ) : (
        <SectionCard
          title={`${trips.length} Saved ${trips.length === 1 ? "Trip" : "Trips"}`}
          subtitle="Click any row to open the complete route plan and FMCSA log sheets."
          disablePadding
          action={
            <TextField
              size="small"
              placeholder="Search by location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" sx={{ color: "text.secondary", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                width: { xs: 180, sm: 240 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  fontSize: { xs: "16px", sm: "0.8rem" },
                  bgcolor: "#ffffff",
                },
              }}
            />
          }
        >
          {filtered.length === 0 ? (
            <Stack sx={{ py: 6, alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No trips match “{query}”.
              </Typography>
            </Stack>
          ) : (
            <TripHistoryTable
              entries={filtered}
              onDelete={(id) => deleteTrip.mutate(id)}
            />
          )}
        </SectionCard>
      )}

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1, maxWidth: 440 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
          Clear all trip history?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
            This will clear saved trip records from this device's browser memory. Server records remain intact.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setConfirmClear(false)}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            color="error"
            variant="contained"
            onClick={handleClear}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Clear All History
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

