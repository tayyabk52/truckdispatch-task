import { useEffect, useState } from "react";
import { Save, RestartAlt, Person, Settings as SettingsIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { InfoTooltip, SectionCard } from "@/components/ui";
import { useSaveSettings, useSettings } from "@/hooks/useStorage";
import {
  DEFAULT_SETTINGS,
  type UserSettings,
} from "@/storage/types";
import { storage } from "@/storage";

/**
 * Driver defaults and app preferences. Defaults saved here prefill the
 * Plan Trip form automatically, so recurring info (driver name, carrier,
 * truck) only needs to be entered once.
 */
export default function SettingsPage() {
  const { data: saved } = useSettings();
  const saveSettings = useSaveSettings();
  const [draft, setDraft] = useState<UserSettings>(saved ?? DEFAULT_SETTINGS);
  const [toast, setToast] = useState(false);

  // Sync local draft when the stored settings load/change.
  useEffect(() => {
    if (saved) setDraft(saved);
  }, [saved]);

  const setDefault = (field: keyof UserSettings["defaults"], value: string) =>
    setDraft((d) => ({ ...d, defaults: { ...d.defaults, [field]: value } }));

  const setPref = <K extends keyof UserSettings["preferences"]>(
    field: K,
    value: UserSettings["preferences"][K]
  ) => setDraft((d) => ({ ...d, preferences: { ...d.preferences, [field]: value } }));

  const handleSave = () => {
    saveSettings.mutate(draft, { onSuccess: () => setToast(true) });
  };

  const handleReset = () => setDraft(DEFAULT_SETTINGS);

  return (
    <Box sx={{ width: "100%", pb: 3 }}>
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
              Settings
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: "0.78rem" }}>
              Driver defaults and app preferences saved with {storage.name} storage
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.25}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RestartAlt />}
              onClick={handleReset}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                fontSize: "0.8rem",
                textTransform: "none",
                borderColor: "divider",
                color: "text.primary",
                height: 34,
              }}
            >
              Reset
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={saveSettings.isPending}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                fontSize: "0.8rem",
                textTransform: "none",
                height: 34,
              }}
            >
              Save Settings
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Stack spacing={2.5}>
        {/* Driver & Carrier Defaults */}
        <SectionCard
          title="Driver & Carrier Defaults"
          subtitle="Prefills the Plan Trip form automatically so recurring info is saved."
          icon={<Person fontSize="small" />}
        >
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            }}
          >
            <TextField
              size="small"
              label="Driver Name"
              value={draft.defaults.driver_name}
              onChange={(e) => setDefault("driver_name", e.target.value)}
              slotProps={{ input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.85rem" } } } }}
            />
            <TextField
              size="small"
              label="Co-Driver"
              value={draft.defaults.co_driver}
              onChange={(e) => setDefault("co_driver", e.target.value)}
              slotProps={{ input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.85rem" } } } }}
            />
            <TextField
              size="small"
              label="Carrier Name"
              value={draft.defaults.carrier_name}
              onChange={(e) => setDefault("carrier_name", e.target.value)}
              slotProps={{ input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.85rem" } } } }}
            />
            <TextField
              size="small"
              label="Main Office Address"
              value={draft.defaults.main_office}
              onChange={(e) => setDefault("main_office", e.target.value)}
              slotProps={{ input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.85rem" } } } }}
            />
            <TextField
              size="small"
              label="Truck #"
              value={draft.defaults.truck_number}
              onChange={(e) => setDefault("truck_number", e.target.value)}
              slotProps={{ input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.85rem" } } } }}
            />
            <TextField
              size="small"
              label="Trailer #"
              value={draft.defaults.trailer_number}
              onChange={(e) => setDefault("trailer_number", e.target.value)}
              slotProps={{ input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.85rem" } } } }}
            />
          </Box>
        </SectionCard>

        {/* Preferences */}
        <SectionCard
          title="App & Cycle Preferences"
          subtitle="Display units and initial cycle hours for new trip planning."
          icon={<SettingsIcon fontSize="small" />}
        >
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              mb: 2,
            }}
          >
            <TextField
              size="small"
              label="Default Cycle Used (hrs)"
              type="number"
              value={draft.preferences.default_cycle_used_hours}
              onChange={(e) =>
                setPref(
                  "default_cycle_used_hours",
                  Math.min(70, Math.max(0, parseFloat(e.target.value) || 0))
                )
              }
              slotProps={{
                htmlInput: { min: 0, max: 70, step: 0.25 },
                input: {
                  sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.85rem" } },
                  endAdornment: (
                    <InfoTooltip title="Starting value for cycle hours on new trip plans." size={14} />
                  ),
                },
              }}
            />
            <TextField
              select
              size="small"
              label="Distance Unit"
              value={draft.preferences.distance_unit}
              onChange={(e) =>
                setPref("distance_unit", e.target.value as "mi" | "km")
              }
              slotProps={{ input: { sx: { borderRadius: 2, fontSize: { xs: "16px", sm: "0.85rem" } } } }}
            >
              <MenuItem value="mi">Miles (mi)</MenuItem>
              <MenuItem value="km">Kilometers (km)</MenuItem>
            </TextField>
          </Box>

          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              bgcolor: "#f0f9ff",
              color: "#0369a1",
              border: "1px solid #bae6fd",
              fontSize: "0.78rem",
            }}
          >
            Distances calculated by the routing system are stored in miles. Changing distance unit converts display values across the UI.
          </Alert>
        </SectionCard>
      </Stack>

      <Snackbar
        open={toast}
        autoHideDuration={2500}
        onClose={() => setToast(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setToast(false)} sx={{ borderRadius: 2 }}>
          Settings saved successfully
        </Alert>
      </Snackbar>
    </Box>
  );
}

