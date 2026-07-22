import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  MyLocation,
  Place,
  Route as RouteIcon,
  Schedule,
  Map as MapIcon,
  ReceiptLong,
} from "@mui/icons-material";

import { createTrip } from "@/api/trips";
import type { Trip, TripCreatePayload } from "@/types/trip";
import PlacesAutocomplete from "@/components/PlacesAutocomplete";
import { SectionCard } from "@/components/ui";
import { useSaveTrip, useSettings } from "@/hooks/useStorage";

const FORM_CARD_SX = {
  borderRadius: 2.5,
  bgcolor: "#ffffff",
  border: "1px solid",
  borderColor: "divider",
  boxShadow: "none",
  "& .MuiCardContent-root": {
    p: { xs: 2, sm: 2.5 },
  },
};

/**
 * Plan Trip Page — Clean, un-cluttered Google UI layout.
 * Focuses on readable typography, subtle timeline rail, and flat minimalist cards without noisy chips or heavy bolding.
 */
export default function PlanTripPage() {
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const saveTrip = useSaveTrip();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [form, setForm] = useState<TripCreatePayload>({
    current_location: "",
    pickup_location: "",
    dropoff_location: "",
    current_cycle_used_hours: 0,
    start_datetime: new Date().toISOString().slice(0, 16),
  });

  const [advanced, setAdvanced] = useState({
    driver_name: "",
    carrier_name: "",
    main_office: "",
    truck_number: "",
    trailer_number: "",
    co_driver: "",
    shipper_name: "",
    commodity: "",
    bol_number: "",
  });

  useEffect(() => {
    if (!settings) return;
    setAdvanced((prev) => ({
      ...prev,
      driver_name: prev.driver_name || settings.defaults.driver_name,
      co_driver: prev.co_driver || settings.defaults.co_driver,
      carrier_name: prev.carrier_name || settings.defaults.carrier_name,
      main_office: prev.main_office || settings.defaults.main_office,
      truck_number: prev.truck_number || settings.defaults.truck_number,
      trailer_number: prev.trailer_number || settings.defaults.trailer_number,
    }));
    setForm((prev) => ({
      ...prev,
      current_cycle_used_hours:
        prev.current_cycle_used_hours ||
        settings.preferences.default_cycle_used_hours,
    }));
  }, [settings]);

  const updateForm = (field: keyof TripCreatePayload, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateAdvanced = (field: string, value: string) => {
    setAdvanced((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): string | null => {
    if (!form.current_location.trim()) return "Current location is required.";
    if (!form.pickup_location.trim()) return "Pickup location is required.";
    if (!form.dropoff_location.trim()) return "Drop-off location is required.";
    if (
      form.pickup_location.trim().toLowerCase() ===
      form.dropoff_location.trim().toLowerCase()
    )
      return "Pickup and drop-off must be different locations.";
    if (form.current_cycle_used_hours < 0 || form.current_cycle_used_hours > 70)
      return "Cycle hours must be between 0 and 70.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload: TripCreatePayload = { ...form, ...advanced };
      const trip: Trip = await createTrip(payload);

      saveTrip.mutate({
        id: trip.id,
        originLabel: trip.current_location_label,
        pickupLabel: trip.pickup_label,
        dropoffLabel: trip.dropoff_label,
        totalDistanceMiles: trip.total_distance_miles,
        totalDrivingMinutes: trip.total_driving_minutes,
        dailyLogCount: trip.daily_logs.length,
        plannedAt: new Date().toISOString(),
      });

      navigate(`/trips/${trip.id}`);
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.dropoff_location?.[0] ||
        err?.message ||
        "Failed to plan trip. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const remainingHours = Math.max(0, 70 - form.current_cycle_used_hours);
  const cyclePercent = (form.current_cycle_used_hours / 70) * 100;
  const cycleColor =
    cyclePercent > 85 ? "#ef4444" : cyclePercent > 65 ? "#f59e0b" : "#1a73e8";

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      {/* Clean Flat Hero Header */}
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
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "text.primary",
            fontSize: { xs: "1.25rem", sm: "1.45rem" },
            mb: 0.35,
          }}
        >
          Plan a New Trip
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: "0.78rem" }}>
          Build FMCSA-compliant routes, automatic HOS rest breaks, and printable ELD daily log sheets
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.25fr) minmax(300px, 0.75fr)" },
            gap: { xs: 2, sm: 2.5 },
            alignItems: "start",
          }}
        >
          {/* Main Form Left Column */}
          <Stack spacing={2.5} sx={{ minWidth: 0 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* 1. Route Locations */}
            <SectionCard
              title="1. Trip Route Stops"
              subtitle="Origin, pickup load, and final delivery."
              cardSx={FORM_CARD_SX}
              icon={<MapIcon fontSize="small" sx={{ color: "primary.main" }} />}
            >
              <Stack spacing={2} sx={{ mt: 0.5 }}>
                {/* Connected Node Visualizer Layout */}
                <Stack direction="row" spacing={1.75} sx={{ alignItems: "stretch" }}>
                  {/* Subtle Node Rail */}
                  <Stack sx={{ width: 16, flexShrink: 0, alignItems: "center", py: 1.25 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: "#10b981",
                        mt: 1.25,
                      }}
                    />
                    <Box sx={{ flex: 1, width: 1.5, bgcolor: "divider", my: 0.5 }} />

                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: "#1a73e8",
                        mt: 1.25,
                      }}
                    />
                    <Box sx={{ flex: 1, width: 1.5, bgcolor: "divider", my: 0.5 }} />

                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: "#ef4444",
                        mt: 1.25,
                      }}
                    />
                  </Stack>

                  {/* Clean Input Stack */}
                  <Stack spacing={1.75} sx={{ flex: 1, minWidth: 0 }}>
                    <PlacesAutocomplete
                      label="Origin (Current Location)"
                      placeholder="e.g. Chicago, IL"
                      value={form.current_location}
                      onChange={(val) => updateForm("current_location", val)}
                      icon={<MyLocation fontSize="small" style={{ fontSize: 16, color: "#10b981" }} />}
                      required
                      size="small"
                      helperText="Current truck location"
                    />

                    <PlacesAutocomplete
                      label="Pickup Location"
                      placeholder="e.g. Indianapolis, IN"
                      value={form.pickup_location}
                      onChange={(val) => updateForm("pickup_location", val)}
                      icon={<Place fontSize="small" style={{ fontSize: 16, color: "#1a73e8" }} />}
                      required
                      size="small"
                      helperText="Loading location (1 hr on-duty)"
                    />

                    <PlacesAutocomplete
                      label="Drop-off Location"
                      placeholder="e.g. Columbus, OH"
                      value={form.dropoff_location}
                      onChange={(val) => updateForm("dropoff_location", val)}
                      icon={<Place fontSize="small" style={{ fontSize: 16, color: "#ef4444" }} />}
                      required
                      size="small"
                      helperText="Final delivery point (1 hr on-duty)"
                    />
                  </Stack>
                </Stack>
              </Stack>
            </SectionCard>

            {/* 2. Hours of Service */}
            <SectionCard
              title="2. Hours of Service (HOS) & Timing"
              subtitle="Starting cycle hours and scheduled departure timestamp."
              cardSx={FORM_CARD_SX}
              icon={<Schedule fontSize="small" sx={{ color: "primary.main" }} />}
            >
              <Stack spacing={2}>
                {/* Clean Cycle Bar */}
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid", borderColor: "divider" }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.75rem", color: "text.primary" }}>
                      70-Hour / 8-Day Cycle Availability
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: cycleColor, fontSize: "0.75rem" }}>
                      {remainingHours.toFixed(1)} hrs remaining
                    </Typography>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, cyclePercent)}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: "#e2e8f0",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: cycleColor,
                        borderRadius: 3,
                      },
                      mb: 1.5,
                    }}
                  />

                  <Box sx={{ display: "grid", gap: 1.75, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                    <TextField
                      size="small"
                      label="Current Cycle Used"
                      type="number"
                      value={form.current_cycle_used_hours}
                      onChange={(e) =>
                        updateForm(
                          "current_cycle_used_hours",
                          Math.min(70, Math.max(0, parseFloat(e.target.value) || 0))
                        )
                      }
                      required
                      slotProps={{
                        input: {
                          sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.835rem" }, bgcolor: "#ffffff" },
                          startAdornment: (
                            <InputAdornment position="start">
                              <Schedule fontSize="small" style={{ fontSize: 16, color: "text.secondary" }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
                                / 70 hrs
                              </Typography>
                            </InputAdornment>
                          ),
                        },
                        htmlInput: { min: 0, max: 70, step: 0.25 },
                      }}
                      helperText="Hours used in last 8 days"
                    />

                    <TextField
                      size="small"
                      label="Trip Departure Time"
                      type="datetime-local"
                      value={form.start_datetime}
                      onChange={(e) => updateForm("start_datetime", e.target.value)}
                      required
                      slotProps={{
                        inputLabel: { shrink: true },
                        input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.835rem" }, bgcolor: "#ffffff" } },
                      }}
                      helperText="Scheduled departure time"
                    />
                  </Box>
                </Box>
              </Stack>
            </SectionCard>

            {/* 3. Paperwork & Driver Details */}
            <SectionCard
              title="3. Optional Driver & Paperwork Details"
              subtitle="Details printed on generated ELD daily log sheets."
              cardSx={FORM_CARD_SX}
              icon={<ReceiptLong fontSize="small" sx={{ color: "primary.main" }} />}
              action={
                <Button
                  size="small"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  endIcon={showAdvanced ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                  sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.78rem" }}
                >
                  {showAdvanced ? "Hide Details" : "Show Paperwork"}
                </Button>
              }
            >
              {!showAdvanced && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", display: "block" }}>
                  Driver: {advanced.driver_name || "Default"} • Carrier: {advanced.carrier_name || "Default"} • Truck: {advanced.truck_number || "Default"}
                </Typography>
              )}
              <Collapse in={showAdvanced}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75, display: "block" }}>
                      Driver & Carrier Information
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                      <TextField size="small" label="Driver Name" value={advanced.driver_name} onChange={(e) => updateAdvanced("driver_name", e.target.value)} slotProps={{ input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.835rem" } } } }} />
                      <TextField size="small" label="Co-Driver" value={advanced.co_driver} onChange={(e) => updateAdvanced("co_driver", e.target.value)} slotProps={{ input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.835rem" } } } }} />
                      <TextField size="small" label="Carrier Name" value={advanced.carrier_name} onChange={(e) => updateAdvanced("carrier_name", e.target.value)} slotProps={{ input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.835rem" } } } }} />
                      <TextField size="small" label="Main Office Address" value={advanced.main_office} onChange={(e) => updateAdvanced("main_office", e.target.value)} slotProps={{ input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.835rem" } } } }} />
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75, display: "block" }}>
                      Vehicle Equipment
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                      <TextField size="small" label="Truck #" value={advanced.truck_number} onChange={(e) => updateAdvanced("truck_number", e.target.value)} slotProps={{ input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.835rem" } } } }} />
                      <TextField size="small" label="Trailer #" value={advanced.trailer_number} onChange={(e) => updateAdvanced("trailer_number", e.target.value)} slotProps={{ input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.835rem" } } } }} />
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75, display: "block" }}>
                      Manifest / Shipment Paperwork
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                      <TextField size="small" label="Shipper Name" value={advanced.shipper_name} onChange={(e) => updateAdvanced("shipper_name", e.target.value)} slotProps={{ input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.835rem" } } } }} />
                      <TextField size="small" label="Commodity" value={advanced.commodity} onChange={(e) => updateAdvanced("commodity", e.target.value)} slotProps={{ input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.835rem" } } } }} />
                      <TextField size="small" label="BOL / Manifest #" value={advanced.bol_number} onChange={(e) => updateAdvanced("bol_number", e.target.value)} slotProps={{ input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.835rem" } } } }} sx={{ gridColumn: { sm: "1 / -1" } }} />
                    </Box>
                  </Box>
                </Stack>
              </Collapse>
            </SectionCard>

            {/* Clean Submit Button CTA */}
            <Box>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RouteIcon fontSize="small" />}
                sx={{
                  height: 42,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textTransform: "none",
                }}
              >
                {loading ? "Calculating Route & Log Sheets…" : "Plan Trip & Generate Log Sheets"}
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", textAlign: "center", mt: 1.25, fontSize: "0.72rem" }}
              >
                Calculates FMCSA 70hr/8day compliance, 11h driving limit, 14h duty limit, and fuel stops every 1,000 mi.
              </Typography>
            </Box>
          </Stack>

          {/* Right Column Sidebar */}
          <Stack spacing={2.5} sx={{ minWidth: 0, position: { lg: "sticky" }, top: { lg: 80 } }}>
            <SectionCard
              title="Calculation Pipeline"
              subtitle="Automated FMCSA compliance workflow."
              cardSx={FORM_CARD_SX}
            >
              <Stack spacing={1.5} divider={<Divider flexItem />}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.78rem" }}>
                    1. Route & Fuel Stops
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.74rem", mt: 0.25 }}>
                    Calculates distance and inserts mandatory fuel stops every 1,000 mi.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.78rem" }}>
                    2. HOS Compliance Rules
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.74rem", mt: 0.25 }}>
                    Enforces 30-min break after 8h driving & 10h daily off-duty rest.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.78rem" }}>
                    3. Printable Daily Logs
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.74rem", mt: 0.25 }}>
                    Renders 24-hour grid log sheets for each day of the route.
                  </Typography>
                </Box>
              </Stack>
            </SectionCard>

            <SectionCard
              title="Saved Settings Profile"
              subtitle="Loaded from settings."
              cardSx={FORM_CARD_SX}
            >
              <Stack spacing={1} sx={{ fontSize: "0.75rem" }}>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="caption" color="text.secondary">Driver:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{advanced.driver_name || "Default"}</Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="caption" color="text.secondary">Carrier:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{advanced.carrier_name || "Default"}</Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="caption" color="text.secondary">Truck #:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{advanced.truck_number || "Default"}</Typography>
                </Stack>
                <Divider sx={{ my: 0.25 }} />
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="caption" color="text.secondary">Cycle Starting Used:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "primary.main" }}>
                    {form.current_cycle_used_hours} / 70 hrs
                  </Typography>
                </Stack>
              </Stack>
            </SectionCard>
          </Stack>
        </Box>
      </form>
    </Box>
  );
}



