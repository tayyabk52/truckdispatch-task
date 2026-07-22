import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowForward,
  DeleteOutlined,
  Place,
  Route as RouteIcon,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { TripHistoryEntry } from "@/storage/types";
import { formatDate, formatDuration } from "@/lib/tripDisplay";

interface TripHistoryTableProps {
  entries: TripHistoryEntry[];
  onDelete?: (id: string) => void;
}

type SortKey = "route" | "plannedAt" | "distance" | "driving";
type SortDir = "asc" | "desc";

function shortLabel(label: string): string {
  return label.split(",")[0].trim() || label;
}

const HEAD_CELLS: {
  key: SortKey;
  label: string;
  numeric: boolean;
  hideBelow?: "sm" | "md";
}[] = [
  { key: "route", label: "Route Plan", numeric: false },
  { key: "plannedAt", label: "Date Planned", numeric: false, hideBelow: "sm" },
  { key: "distance", label: "Distance", numeric: true },
  { key: "driving", label: "Driving Time", numeric: true, hideBelow: "md" },
];

/**
 * Trip history rendered as a sortable flat data table.
 */
export default function TripHistoryTable({
  entries,
  onDelete,
}: TripHistoryTableProps) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>("plannedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "route" ? "asc" : "desc");
    }
  };

  const sorted = useMemo(() => {
    const factor = sortDir === "asc" ? 1 : -1;
    return [...entries].sort((a, b) => {
      switch (sortKey) {
        case "route":
          return (
            shortLabel(a.originLabel).localeCompare(shortLabel(b.originLabel)) *
            factor
          );
        case "distance":
          return (
            ((a.totalDistanceMiles ?? -1) - (b.totalDistanceMiles ?? -1)) *
            factor
          );
        case "driving":
          return (
            ((a.totalDrivingMinutes ?? -1) - (b.totalDrivingMinutes ?? -1)) *
            factor
          );
        case "plannedAt":
        default:
          return (
            (new Date(a.plannedAt).getTime() -
              new Date(b.plannedAt).getTime()) *
            factor
          );
      }
    });
  }, [entries, sortKey, sortDir]);

  return (
    <TableContainer sx={{ bgcolor: "#ffffff" }}>
      <Table sx={{ minWidth: 560 }} aria-label="Trip history">
        <TableHead>
          <TableRow sx={{ bgcolor: "#fafafa" }}>
            {HEAD_CELLS.map((cell) => (
              <TableCell
                key={cell.key}
                align={cell.numeric ? "right" : "left"}
                sortDirection={sortKey === cell.key ? sortDir : false}
                sx={{
                  py: 1.25,
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  ...(cell.hideBelow
                    ? { display: { xs: "none", [cell.hideBelow]: "table-cell" } }
                    : {}),
                }}
              >
                <TableSortLabel
                  active={sortKey === cell.key}
                  direction={sortKey === cell.key ? sortDir : "asc"}
                  onClick={() => handleSort(cell.key)}
                  sx={{
                    "&.MuiTableSortLabel-active": { color: "primary.main" },
                    fontSize: "0.72rem",
                    fontWeight: 700,
                  }}
                >
                  {cell.label}
                </TableSortLabel>
              </TableCell>
            ))}
            {onDelete && <TableCell padding="checkbox" aria-label="Actions" sx={{ bgcolor: "#fafafa" }} />}
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((entry) => (
            <TableRow
              key={entry.id}
              hover
              onClick={() => navigate(`/trips/${entry.id}`)}
              sx={{
                cursor: "pointer",
                transition: "background-color 0.15s ease",
                "&:hover": { bgcolor: "#f8fafc" },
                "&:last-child td, &:last-child th": { border: 0 },
              }}
            >
              <TableCell sx={{ py: 1.5 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      flexShrink: 0,
                      display: { xs: "none", sm: "flex" },
                      alignItems: "center",
                      justifyContent: "center",
                      color: "primary.main",
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                    }}
                  >
                    <RouteIcon style={{ fontSize: 18 }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack
                      direction="row"
                      spacing={0.6}
                      sx={{ alignItems: "center" }}
                    >
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600, fontSize: "0.835rem", color: "text.primary" }}>
                        {shortLabel(entry.originLabel)}
                      </Typography>
                      <ArrowForward
                        sx={{ fontSize: 13, color: "text.disabled", flexShrink: 0 }}
                      />
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600, fontSize: "0.835rem", color: "text.primary" }}>
                        {shortLabel(entry.dropoffLabel)}
                      </Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ alignItems: "center", color: "text.secondary", mt: 0.15 }}
                    >
                      <Place sx={{ fontSize: 12, flexShrink: 0 }} />
                      <Typography variant="caption" noWrap sx={{ fontSize: "0.74rem" }}>
                        via {shortLabel(entry.pickupLabel)}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </TableCell>

              <TableCell sx={{ display: { xs: "none", sm: "table-cell" }, py: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.78rem" }}>
                  {formatDate(entry.plannedAt)}
                </Typography>
              </TableCell>

              <TableCell align="right" sx={{ py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.85rem", color: "text.primary" }}>
                  {entry.totalDistanceMiles != null
                    ? `${Math.round(entry.totalDistanceMiles)} mi`
                    : "—"}
                </Typography>
              </TableCell>

              <TableCell
                align="right"
                sx={{ display: { xs: "none", md: "table-cell" }, py: 1.5 }}
              >
                <Chip
                  size="small"
                  variant="outlined"
                  label={formatDuration(entry.totalDrivingMinutes)}
                  sx={{
                    height: 22,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    bgcolor: alpha("#000", 0.02),
                    borderColor: "divider",
                  }}
                />
              </TableCell>

              {onDelete && (
                <TableCell padding="checkbox" sx={{ py: 1.5 }}>
                  <Tooltip title="Remove from history">
                    <IconButton
                      size="small"
                      aria-label="Remove trip from history"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(entry.id);
                      }}
                      sx={{
                        color: "text.secondary",
                        "&:hover": { color: "error.main", bgcolor: alpha("#ef4444", 0.08) },
                      }}
                    >
                      <DeleteOutlined style={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

