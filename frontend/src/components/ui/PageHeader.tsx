import { Box, Stack, Typography } from "@mui/material";

import InfoTooltip from "./InfoTooltip";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional plain-language help shown as a "?" beside the title. */
  help?: React.ReactNode;
  /** Optional right-aligned actions (buttons, etc.). */
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * Consistent page title block used at the top of every page. Keeps
 * heading size, spacing, and the optional actions row uniform across the
 * app, and stacks gracefully on mobile.
 */
export default function PageHeader({
  title,
  subtitle,
  help,
  actions,
  icon,
}: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        mb: 3,
      }}
    >
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          {icon && (
            <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
          )}
          <Typography variant="h4" component="h1">
            {title}
          </Typography>
          {help && <InfoTooltip title={help} size={18} />}
        </Stack>
        {subtitle && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>
          {actions}
        </Stack>
      )}
    </Stack>
  );
}
