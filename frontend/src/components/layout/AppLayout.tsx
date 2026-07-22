import { useState } from "react";
import { Add, Menu as MenuIcon } from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import SidebarContent from "./SidebarContent";
import { ALL_NAV_ITEMS } from "./navConfig";

const DRAWER_WIDTH = 256;

/** Derive a human page title from the current path for the top bar. */
function usePageTitle(): string {
  const { pathname } = useLocation();
  if (pathname.startsWith("/trips/")) {
    return pathname.includes("/logs") ? "Driver Log Sheets" : "Trip Results & Route Plan";
  }
  const match = ALL_NAV_ITEMS.find(
    (i) => i.path === pathname || (i.path !== "/" && pathname.startsWith(i.path))
  );
  if (match) return match.label;
  if (pathname === "/") return "Dashboard Overview";
  return "TruckDispatch";
}

/**
 * The application shell: permanent clean sidebar on desktop, slide-in drawer on mobile, and a flat top bar.
 */
export default function AppLayout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = usePageTitle();

  const closeMobile = () => setMobileOpen(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f4f6" }}>
      {/* Navigation drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="Main navigation"
      >
        {isDesktop ? (
          <Drawer
            variant="permanent"
            open
            sx={{
              "& .MuiDrawer-paper": {
                width: DRAWER_WIDTH,
                boxSizing: "border-box",
                borderRight: "1px solid",
                borderColor: "#e5e7eb",
                bgcolor: "#f4f4f6",
              },
            }}
          >
            <SidebarContent />
          </Drawer>
        ) : (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={closeMobile}
            ModalProps={{ keepMounted: true }}
            sx={{
              "& .MuiDrawer-paper": {
                width: DRAWER_WIDTH,
                boxSizing: "border-box",
                bgcolor: "#f4f4f6",
              },
            }}
          >
            <SidebarContent onNavigate={closeMobile} />
          </Drawer>
        )}
      </Box>

      {/* Main column */}
      <Box
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Top bar */}
        <AppBar
          position="sticky"
          sx={{
            zIndex: (t) => t.zIndex.drawer - 1,
            bgcolor: "#f4f4f6",
            color: "#111827",
            boxShadow: "none",
            borderBottom: "1px solid",
            borderColor: "#e5e7eb",
          }}
        >
          <Toolbar sx={{ gap: 1.5, minHeight: "64px !important", px: { xs: 2, sm: 3 } }}>
            {!isDesktop && (
              <IconButton
                edge="start"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                size="small"
                sx={{ color: "#4b5563" }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Typography
              variant="subtitle1"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                fontSize: "1.1rem",
                letterSpacing: "-0.015em",
                color: "#111827",
              }}
              noWrap
            >
              {pageTitle}
            </Typography>

            {/* Header Right Action Items */}
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              {/* User Avatar */}
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: "#111827",
                  color: "#ffffff",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                }}
              >
                TD
              </Avatar>

              {/* Plan Trip CTA */}
              {pathname !== "/plan" && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => navigate("/plan")}
                  sx={{
                    display: { xs: "none", sm: "inline-flex" },
                    borderRadius: "10px",
                    fontWeight: 600,
                    fontSize: "0.825rem",
                    textTransform: "none",
                    bgcolor: "#111827",
                    color: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    px: 2,
                    height: 36,
                    "&:hover": { bgcolor: "#1f2937" },
                  }}
                >
                  Plan Trip
                </Button>
              )}
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 3.5 },
            width: "100%",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

