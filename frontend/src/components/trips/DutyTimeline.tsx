import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { DutyStatusEvent } from "@/types/trip";
import { dutyMeta, formatDuration, formatTime } from "@/lib/tripDisplay";

interface DutyTimelineProps {
  events: Pick<
    DutyStatusEvent,
    "start_time" | "end_time" | "status" | "remark"
  >[];
}

/**
 * Table of duty-status changes for a single day. Flatter, compact layout.
 */
export default function DutyTimeline({ events }: DutyTimelineProps) {
  if (events.length === 0) return null;

  return (
    <TableContainer
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "#ffffff",
        boxShadow: "none",
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#fafafa" }}>
            <TableCell sx={{ fontWeight: 600, fontSize: "0.72rem", py: 1.2, color: "text.secondary", textTransform: "uppercase" }}>Duty Status</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: "0.72rem", py: 1.2, color: "text.secondary", textTransform: "uppercase" }}>Start</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: "0.72rem", py: 1.2, color: "text.secondary", textTransform: "uppercase" }}>End</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: "0.72rem", py: 1.2, color: "text.secondary", textTransform: "uppercase" }}>Duration</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: "0.72rem", py: 1.2, color: "text.secondary", textTransform: "uppercase" }}>Remark / Location</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events.map((event, i) => {
            const start = new Date(event.start_time);
            const end = new Date(event.end_time);
            const mins = Math.round(
              (end.getTime() - start.getTime()) / 60000
            );
            const meta = dutyMeta(event.status);
            return (
              <TableRow key={i} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell sx={{ py: 1 }}>
                  <Chip
                    label={meta.label}
                    size="small"
                    sx={{
                      bgcolor: alpha(meta.color, 0.08),
                      color: meta.color,
                      fontWeight: 600,
                      fontSize: "0.68rem",
                      height: 20,
                      borderRadius: 1,
                      border: `1px solid ${alpha(meta.color, 0.2)}`,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 500, fontSize: "0.8rem" }}>{formatTime(event.start_time)}</TableCell>
                <TableCell sx={{ fontWeight: 500, fontSize: "0.8rem" }}>{formatTime(event.end_time)}</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem", color: meta.color }}>{formatDuration(mins)}</TableCell>
                <TableCell>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      maxWidth: 280,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "text.secondary",
                      fontSize: "0.75rem",
                    }}
                  >
                    {event.remark}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}


