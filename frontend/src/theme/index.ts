import { createTheme, alpha } from "@mui/material/styles";

/**
 * Google-inspired light theme.
 *
 * Palette, radii, and shadows are tuned to feel like a modern, clean
 * dispatch dashboard: calm surfaces, a confident blue primary, and soft
 * elevation instead of heavy borders. All components in the app inherit
 * from this single source of truth.
 */

// Brand palette -------------------------------------------------------------
const BRAND = {
  blue: "#1a73e8", // Google blue 600
  blueDark: "#1557b0",
  blueLight: "#4285f4",
  green: "#188038", // status: off-duty / success
  amber: "#f9ab00", // status: on-duty (not driving) / warning
  purple: "#8430ce", // status: sleeper berth
  red: "#d93025", // status: error
  ink: "#202124", // primary text (Google grey 900)
  inkSoft: "#5f6368", // secondary text (Google grey 700)
  line: "#dadce0", // dividers / borders (Google grey 300)
  surface: "#ffffff",
  canvas: "#f4f4f6", // unified app canvas background
};

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: BRAND.blue,
      dark: BRAND.blueDark,
      light: BRAND.blueLight,
      contrastText: "#ffffff",
    },
    secondary: {
      main: BRAND.purple,
      contrastText: "#ffffff",
    },
    success: { main: BRAND.green },
    warning: { main: BRAND.amber },
    error: { main: BRAND.red },
    info: { main: BRAND.blueLight },
    background: {
      default: BRAND.canvas,
      paper: BRAND.surface,
    },
    text: {
      primary: BRAND.ink,
      secondary: BRAND.inkSoft,
    },
    divider: BRAND.line,
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily:
      '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700, letterSpacing: "-0.015em" },
    h4: { fontWeight: 700, letterSpacing: "-0.01em" },
    h5: { fontWeight: 600, letterSpacing: "-0.01em" },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: "none" },
    caption: { letterSpacing: 0 },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: BRAND.canvas,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        // Custom, unobtrusive scrollbars for a polished feel.
        "*::-webkit-scrollbar": { width: 10, height: 10 },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: alpha(BRAND.inkSoft, 0.28),
          borderRadius: 8,
          border: "2px solid transparent",
          backgroundClip: "content-box",
        },
        "*::-webkit-scrollbar-thumb:hover": {
          backgroundColor: alpha(BRAND.inkSoft, 0.45),
        },
      },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: {
          backgroundColor: alpha("#ffffff", 0.85),
          backdropFilter: "saturate(180%) blur(8px)",
          borderBottom: `1px solid ${BRAND.line}`,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 16 },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${BRAND.line}`,
          boxShadow: "0 1px 2px rgba(60,64,67,0.06), 0 1px 3px rgba(60,64,67,0.10)",
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 18,
          minHeight: 40,
        },
        sizeLarge: { minHeight: 48, fontSize: "1rem" },
      },
      variants: [
        {
          props: { variant: "contained", color: "primary" },
          style: {
            boxShadow: "0 1px 2px rgba(26,115,232,0.30)",
            "&:hover": { boxShadow: "0 2px 6px rgba(26,115,232,0.35)" },
          },
        },
      ],
    },

    MuiTextField: {
      defaultProps: { variant: "outlined" },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: "#fff",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: BRAND.line,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(BRAND.inkSoft, 0.5),
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          minHeight: 48,
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: BRAND.ink,
          fontSize: "0.75rem",
          lineHeight: 1.5,
          padding: "8px 12px",
          borderRadius: 8,
          maxWidth: 260,
        },
        arrow: { color: BRAND.ink },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          "&.Mui-selected": {
            backgroundColor: alpha(BRAND.blue, 0.12),
            "&:hover": { backgroundColor: alpha(BRAND.blue, 0.16) },
            "& .MuiListItemIcon-root": { color: BRAND.blue },
            "& .MuiListItemText-primary": {
              color: BRAND.blue,
              fontWeight: 600,
            },
          },
        },
      },
    },

    MuiAlert: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
  },
});

/** Shared duty-status colors, kept in one place for logs, maps, and charts. */
export const DUTY_STATUS_COLORS: Record<string, string> = {
  off_duty: BRAND.green,
  sleeper_berth: BRAND.purple,
  driving: BRAND.blue,
  on_duty_not_driving: BRAND.amber,
};

export const BRAND_COLORS = BRAND;

export default theme;
