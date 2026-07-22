import { SearchOff } from "@mui/icons-material";
import { Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Stack
      spacing={2}
      sx={{
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
      }}
    >
      <SearchOff sx={{ fontSize: 72, color: "text.disabled" }} />
      <Typography variant="h3">404</Typography>
      <Typography variant="h6" color="text.secondary">
        We couldn't find that page.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/")}>
        Back to Dashboard
      </Button>
    </Stack>
  );
}
