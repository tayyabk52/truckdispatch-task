import { Box, CircularProgress, Stack, Typography } from "@mui/material";

interface LoadingStateProps {
  message?: string;
  /** Fill the viewport height when used as a full-page loader. */
  fullHeight?: boolean;
}

/** Centered spinner with an optional message. */
export default function LoadingState({
  message = "Loading…",
  fullHeight,
}: LoadingStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: fullHeight ? "60vh" : 220,
        width: "100%",
      }}
    >
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Stack>
    </Box>
  );
}
