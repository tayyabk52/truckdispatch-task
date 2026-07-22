import { Download } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";

import type { DailyLog } from "@/types/trip";

interface LogSheetViewerProps {
  log: DailyLog;
}

/**
 * Renders the server-generated FMCSA daily log SVG with a download action.
 *
 * The SVG URL construction and download behavior are preserved exactly
 * from the original implementation to avoid breaking the backend contract.
 */
export default function LogSheetViewer({ log }: LogSheetViewerProps) {
  const apiBase =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
  const svgUrl = `${apiBase}${log.svg_url}`;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = svgUrl;
    link.download = `daily-log-${log.log_date}.svg`;
    link.click();
  };

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
          FMCSA Driver&apos;s Daily Log Sheet
        </Typography>
        <Button
          size="small"
          startIcon={<Download />}
          onClick={handleDownload}
          variant="outlined"
          sx={{
            borderRadius: 2.5,
            fontWeight: 700,
            textTransform: "none",
            borderColor: "divider",
            color: "text.primary",
            "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" },
          }}
        >
          Download SVG
        </Button>
      </Stack>
      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: "#ffffff",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          p: 1,
        }}
      >
        <img
          src={svgUrl}
          alt={`Daily log for ${log.log_date}`}
          style={{ width: "100%", height: "auto", minHeight: 200, display: "block", borderRadius: 8 }}
        />
      </Box>
    </Box>
  );
}

