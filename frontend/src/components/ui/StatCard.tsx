import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import InfoTooltip from "./InfoTooltip";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  /** Small unit/suffix rendered next to the value (e.g. "mi"). */
  unit?: string;
  /** Accent color for the icon chip. Defaults to the primary color. */
  color?: string;
  /** Optional plain-language explanation shown as a "?" beside the label. */
  help?: React.ReactNode;
}

/**
 * A single KPI tile: labelled metric with an accented icon. Flatter, Google-style compact layout.
 */
export default function StatCard({
  icon,
  label,
  value,
  unit,
  color = "#1a73e8",
  help,
}: StatCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "#ffffff",
        boxShadow: "none",
        transition: "border-color 0.15s ease",
        "&:hover": {
          borderColor: alpha(color, 0.4),
        },
      }}
    >
      <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(color, 0.08),
              color,
              flexShrink: 0,
              "& .MuiSvgIcon-root": { fontSize: 20 },
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mb: 0.15 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  fontSize: "0.65rem",
                }}
              >
                {label}
              </Typography>
              {help && <InfoTooltip title={help} size={12} />}
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "baseline" }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                  color: "text.primary",
                  fontSize: "1.15rem",
                }}
                noWrap
              >
                {value}
              </Typography>
              {unit && (
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                >
                  {unit}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}


