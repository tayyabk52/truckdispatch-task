import { Circle } from "@mui/icons-material";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

import { NAV_SECTIONS, type NavItem } from "./navConfig";
import { useTripHistory } from "@/hooks/useStorage";

interface SidebarContentProps {
  /** Called after navigating — used to close the mobile drawer. */
  onNavigate?: () => void;
}

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.path === "/") return pathname === "/";
  if (pathname === item.path || pathname.startsWith(item.path + "/"))
    return true;
  return (item.matchPrefixes ?? []).some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

/**
 * Sidebar navigation matching the clean, off-white layout with white floating active pills
 * and the generated TruckDispatch logo emblem.
 */
export default function SidebarContent({ onNavigate }: SidebarContentProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: trips = [] } = useTripHistory();

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f4f4f6",
        borderRight: "1px solid",
        borderColor: "#e5e7eb",
      }}
    >
      {/* Brand Header with Generated Logo */}
      <Toolbar sx={{ px: 2.5, minHeight: "64px !important" }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", cursor: "pointer", width: "100%" }}
          onClick={() => go("/")}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="TruckDispatch Logo"
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              border: "1px solid #e5e7eb",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                lineHeight: 1.1,
                fontSize: "0.95rem",
                letterSpacing: "-0.015em",
                color: "#111827",
              }}
            >
              TruckDispatch
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontSize: "0.68rem", fontWeight: 500, color: "#6b7280" }}
            >
              ELD Dispatch Platform
            </Typography>
          </Box>
        </Stack>
      </Toolbar>

      {/* Nav sections */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5 }}>
        {NAV_SECTIONS.map((section, si) => (
          <Box key={si} sx={{ mt: si === 0 ? 0 : 2.5 }}>
            {section.heading && (
              <Typography
                variant="caption"
                sx={{
                  px: 1.5,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "0.625rem",
                  color: "#9ca3af",
                  display: "block",
                  mb: 0.75,
                }}
              >
                {section.heading}
              </Typography>
            )}
            <List disablePadding>
              {section.items.map((item) => {
                const active = isItemActive(item, pathname);
                const badgeCount =
                  item.path === "/history" && trips.length > 0 ? trips.length : null;

                return (
                  <ListItemButton
                    key={item.path}
                    selected={active}
                    onClick={() => go(item.path)}
                    sx={{
                      mb: 0.5,
                      py: 0.9,
                      px: 1.5,
                      borderRadius: "12px",
                      minHeight: 40,
                      position: "relative",
                      bgcolor: active ? "#ffffff" : "transparent",
                      boxShadow: active ? "0 2px 8px rgba(0, 0, 0, 0.05)" : "none",
                      color: active ? "#111827" : "#6b7280",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: active ? "#ffffff" : "#eaebab",
                        color: "#111827",
                      },
                      "&.Mui-selected": {
                        bgcolor: "#ffffff",
                        color: "#111827",
                        "&:hover": {
                          bgcolor: "#ffffff",
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 32,
                        color: active ? "#111827" : "#9ca3af",
                        "& .MuiSvgIcon-root": { fontSize: 19 },
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: {
                          variant: "body2",
                          sx: {
                            fontWeight: active ? 700 : 500,
                            fontSize: "0.835rem",
                            color: active ? "#111827" : "#4b5563",
                          },
                        },
                      }}
                    />

                    {/* Optional Badge */}
                    {badgeCount !== null && (
                      <Box
                        sx={{
                          px: 0.85,
                          py: 0.15,
                          borderRadius: "10px",
                          bgcolor: active ? "#1a73e8" : "#e5e7eb",
                          color: active ? "#ffffff" : "#4b5563",
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          lineHeight: 1.4,
                        }}
                      >
                        {badgeCount}
                      </Box>
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Footer Status Card */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: "12px",
            bgcolor: "#ffffff",
            border: "1px solid",
            borderColor: "#e5e7eb",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
          }}
        >
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 0.25 }}>
            <Circle style={{ fontSize: 7, color: "#16a34a" }} />
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.72rem", color: "#111827" }}>
              FMCSA 70h / 8-Day Cycle
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ fontSize: "0.68rem", color: "#6b7280", display: "block" }}>
            Rule 395.3 Compliant Engine
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}


