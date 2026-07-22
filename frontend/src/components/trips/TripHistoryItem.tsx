import {
  ArrowForward,
  DeleteOutlined,
  Place,
  Route as RouteIcon,
  Schedule,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import type { TripHistoryEntry } from "@/storage/types";
import { formatDate, formatDuration } from "@/lib/tripDisplay";

interface TripHistoryItemProps {
  entry: TripHistoryEntry;
  onDelete?: (id: string) => void;
}

function shortLabel(label: string): string {
  return label.split(",")[0].trim() || label;
}

/**
 * One row in a trip history list. Flatter, clean Google style layout.
 */
export default function TripHistoryItem({
  entry,
  onDelete,
}: TripHistoryItemProps) {
  const navigate = useNavigate();

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: "center",
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        borderRadius: 2,
        cursor: "pointer",
        transition: "background-color 0.15s ease",
        "&:hover": { bgcolor: "#f8fafc" },
      }}
      onClick={() => navigate(`/trips/${entry.id}`)}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 1.5,
          bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
          color: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <RouteIcon style={{ fontSize: 18 }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600, fontSize: "0.835rem", color: "text.primary" }}>
            {shortLabel(entry.originLabel)}
          </Typography>
          <ArrowForward sx={{ fontSize: 13, color: "text.disabled", flexShrink: 0 }} />
          <Typography variant="body2" noWrap sx={{ fontWeight: 600, fontSize: "0.835rem", color: "text.primary" }}>
            {shortLabel(entry.dropoffLabel)}
          </Typography>
        </Stack>
        <Stack
          direction="row"
          spacing={1.25}
          sx={{ alignItems: "center", color: "text.secondary", mt: 0.15 }}
        >
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <Place sx={{ fontSize: 12 }} />
            <Typography variant="caption" noWrap sx={{ fontSize: "0.72rem" }}>
              via {shortLabel(entry.pickupLabel)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <Schedule sx={{ fontSize: 12 }} />
            <Typography variant="caption" sx={{ fontSize: "0.72rem" }}>
              {formatDate(entry.plannedAt)}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ textAlign: "right", flexShrink: 0, display: { xs: "none", sm: "block" } }}>
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.85rem", color: "text.primary" }}>
          {entry.totalDistanceMiles != null
            ? `${Math.round(entry.totalDistanceMiles)} mi`
            : "—"}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
          {formatDuration(entry.totalDrivingMinutes)} driving
        </Typography>
      </Box>

      {onDelete && (
        <Tooltip title="Remove from history">
          <IconButton
            size="small"
            aria-label="Remove trip from history"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(entry.id);
            }}
            sx={{ color: "text.secondary", "&:hover": { color: "error.main", bgcolor: alpha("#ef4444", 0.08) } }}
          >
            <DeleteOutlined style={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}

