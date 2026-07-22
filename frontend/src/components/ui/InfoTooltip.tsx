import { HelpOutlined } from "@mui/icons-material";
import { Tooltip, IconButton } from "@mui/material";

interface InfoTooltipProps {
  /** Plain-language explanation shown on hover/focus/tap. */
  title: React.ReactNode;
  /** Icon size in px. Defaults to 16. */
  size?: number;
  ariaLabel?: string;
}

/**
 * A small "?" affordance that reveals a plain-language explanation of a
 * field or metric. Designed for non-technical users: accessible via
 * keyboard focus and tappable on touch devices (not hover-only).
 */
export default function InfoTooltip({
  title,
  size = 16,
  ariaLabel = "More information",
}: InfoTooltipProps) {
  return (
    <Tooltip title={title} arrow enterTouchDelay={0} leaveTouchDelay={4000}>
      <IconButton
        size="small"
        aria-label={ariaLabel}
        sx={{
          p: 0.25,
          color: "text.disabled",
          "&:hover": { color: "primary.main" },
        }}
        // Prevent the button from submitting forms it may live inside.
        type="button"
        tabIndex={0}
      >
        <HelpOutlined sx={{ fontSize: size }} />
      </IconButton>
    </Tooltip>
  );
}
