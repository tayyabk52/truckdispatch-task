import {
  AccessTime,
  Bedtime,
  Coffee,
  DirectionsCar,
  EventRepeat,
  LocalGasStation,
  Shield,
} from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { SectionCard } from "@/components/ui";

interface Rule {
  icon: React.ReactNode;
  color: string;
  badge: string;
  title: string;
  summary: string;
  detail: string;
}

const STAT_HIGHLIGHTS = [
  { label: "Max Driving", value: "11 Hours", sub: "After 10 consecutive hours off", color: "#1a73e8" },
  { label: "Duty Window", value: "14 Hours", sub: "Starts at initial on-duty time", color: "#f59e0b" },
  { label: "Mandatory Break", value: "30 Mins", sub: "After 8 cumulative driving hrs", color: "#10b981" },
  { label: "8-Day Cycle", value: "70 Hours", sub: "Resets with 34h off-duty restart", color: "#6366f1" },
];

const RULES: Rule[] = [
  {
    icon: <DirectionsCar fontSize="small" />,
    color: "#1a73e8",
    badge: "11-HOUR RULE",
    title: "11-Hour Driving Limit",
    summary: "Drive up to 11 hours after 10 consecutive hours off duty.",
    detail:
      "Once you have completed 10 consecutive hours off-duty, you are allowed a maximum of 11 cumulative hours of driving time before requiring another 10-hour rest break.",
  },
  {
    icon: <AccessTime fontSize="small" />,
    color: "#f59e0b",
    badge: "14-HOUR RULE",
    title: "14-Hour On-Duty Window",
    summary: "Cannot drive beyond the 14th consecutive hour after coming on duty.",
    detail:
      "The 14-hour clock begins the moment you log any on-duty status. Driving is strictly prohibited once the 14-hour window expires, regardless of off-duty breaks taken during the shift.",
  },
  {
    icon: <Coffee fontSize="small" />,
    color: "#10b981",
    badge: "30-MIN BREAK",
    title: "30-Minute Rest Break",
    summary: "Take a 30-minute break after 8 hours of cumulative driving.",
    detail:
      "After driving for 8 cumulative hours without at least a 30-minute interruption, drivers must take a non-driving break (Off-Duty, Sleeper Berth, or On-Duty Not Driving) of at least 30 minutes.",
  },
  {
    icon: <EventRepeat fontSize="small" />,
    color: "#6366f1",
    badge: "70-HOUR CYCLE",
    title: "70-Hour / 8-Day Cycle Limit",
    summary: "Maximum 70 on-duty hours over any 8 consecutive days.",
    detail:
      "This dispatcher applies the 70-hour / 8-day property-carrying rule. Once a driver reaches 70 on-duty hours in an 8-day rolling period, driving is prohibited until hours free up or a 34-hour restart occurs.",
  },
  {
    icon: <Bedtime fontSize="small" />,
    color: "#ef4444",
    badge: "DAILY & CYCLE RESTART",
    title: "10-Hour Rest & 34-Hour Restart",
    summary: "10 hours off resets daily limits; 34 hours off resets cycle hours.",
    detail:
      "A 10-hour off-duty period resets both your 11-hour driving clock and 14-hour duty window. A 34-consecutive-hour off-duty restart resets your 70-hour cycle accumulator back to zero.",
  },
  {
    icon: <LocalGasStation fontSize="small" />,
    color: "#0284c7",
    badge: "DISPATCH LOGIC",
    title: "Fueling & Stop Assumptions",
    summary: "Automated fuel stops every 1,000 miles + 1 hr loading/unloading.",
    detail:
      "For realistic route and log sheet generation, the planning engine automatically inserts a 30-minute fuel break roughly every 1,000 miles and allocates 1 hour of On-Duty time for pickup & drop-off locations.",
  },
];

const DUTY_STATUSES = [
  { label: "OFF-DUTY (OFF)", desc: "Time when driver is fully relieved from work responsibilities.", color: "#64748b" },
  { label: "SLEEPER BERTH (SB)", desc: "Time spent resting inside the vehicle's sleeper berth compartment.", color: "#8b5cf6" },
  { label: "DRIVING (D)", desc: "Time spent operating the commercial motor vehicle controls.", color: "#16a34a" },
  { label: "ON-DUTY NOT DRIVING (ON)", desc: "Pre-trip inspections, loading/unloading, fueling, and administrative work.", color: "#d97706" },
];

const CARD_SX = {
  borderRadius: 2.5,
  bgcolor: "#ffffff",
  border: "1px solid",
  borderColor: "divider",
  boxShadow: "none",
  "& .MuiCardContent-root": {
    p: { xs: 2, sm: 2.5 },
  },
};

export default function HosGuidePage() {
  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      {/* Clean Hero Header */}
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 2.5,
          borderRadius: 3,
          bgcolor: "#ffffff",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "none",
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
          <Shield fontSize="small" sx={{ color: "primary.main", fontSize: 18 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
            FMCSA 49 CFR Part 395 Compliance
          </Typography>
        </Stack>

        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "text.primary",
            fontSize: { xs: "1.25rem", sm: "1.45rem" },
            mb: 0.35,
          }}
        >
          Hours of Service (HOS) Reference Guide
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: "0.78rem" }}>
          Federal HOS regulations enforced by the dispatch planner for property-carrying commercial drivers.
        </Typography>
      </Box>

      {/* Top Scannable Metric Highlights */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
          mb: 2.5,
        }}
      >
        {STAT_HIGHLIGHTS.map((item) => (
          <Box
            key={item.label}
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: "#ffffff",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: "0.72rem", display: "block", mb: 0.5 }}>
              {item.label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.2rem", color: item.color, mb: 0.25 }}>
              {item.value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem", display: "block" }}>
              {item.sub}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Main Grid: HOS Core Rules */}
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          mb: 3,
        }}
      >
        {RULES.map((rule) => (
          <SectionCard key={rule.title} cardSx={CARD_SX}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(rule.color, 0.1),
                  color: rule.color,
                  mt: 0.25,
                }}
              >
                {rule.icon}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.68rem", color: rule.color, letterSpacing: "0.04em", display: "block", mb: 0.25 }}>
                  {rule.badge}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: "0.95rem", color: "text.primary", mb: 0.35 }}>
                  {rule.title}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.82rem", color: "text.primary", mb: 0.75 }}>
                  {rule.summary}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.76rem", lineHeight: 1.5, display: "block" }}>
                  {rule.detail}
                </Typography>
              </Box>
            </Stack>
          </SectionCard>
        ))}
      </Box>

      {/* Official Duty Status Grid Legend */}
      <Box sx={{ mb: 3 }}>
        <SectionCard
          title="ELD Grid Duty Status Definitions"
          subtitle="The four official statuses recorded on 24-hour daily log sheets."
          cardSx={CARD_SX}
        >
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              mt: 1,
            }}
          >
            {DUTY_STATUSES.map((status) => (
              <Box
                key={status.label}
                sx={{
                  p: 1.75,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: status.color }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.78rem", color: "text.primary" }}>
                    {status.label}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.74rem", display: "block", pl: 2.25 }}>
                  {status.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </SectionCard>
      </Box>

      {/* Legal Footer Note */}
      <Box
        sx={{
          p: 2,
          borderRadius: 2.5,
          bgcolor: "#f8fafc",
          border: "1px solid",
          borderColor: "divider",
          textAlign: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.74rem" }}>
          This reference guide is an explanatory summary for planning purposes. Always refer to official FMCSA regulations (49 CFR Part 395) for legal compliance.
        </Typography>
      </Box>
    </Box>
  );
}

