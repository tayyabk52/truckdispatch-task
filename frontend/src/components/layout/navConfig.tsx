import {
  Dashboard as DashboardIcon,
  AddRoad,
  History as HistoryIcon,
  MenuBook,
  Settings as SettingsIcon,
} from "@mui/icons-material";

/** A single navigation destination in the sidebar. */
export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  /** Short description used for tooltips / accessibility. */
  description: string;
  /** Match child routes as active too (e.g. /trips/* under a section). */
  matchPrefixes?: string[];
}

export interface NavSection {
  /** Optional heading shown above the group. */
  heading?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: <DashboardIcon />,
        description: "Overview of your trips and activity",
      },
      {
        label: "Plan Trip",
        path: "/plan",
        icon: <AddRoad />,
        description: "Create a new trip and generate ELD logs",
        matchPrefixes: ["/trips"],
      },
      {
        label: "Trip History",
        path: "/history",
        icon: <HistoryIcon />,
        description: "Trips you have planned before",
      },
    ],
  },
  {
    heading: "Reference",
    items: [
      {
        label: "HOS Guide",
        path: "/hos-guide",
        icon: <MenuBook />,
        description: "Hours of Service rules explained",
      },
      {
        label: "Settings",
        path: "/settings",
        icon: <SettingsIcon />,
        description: "Driver defaults and preferences",
      },
    ],
  },
];

/** Flattened list of all nav items, handy for lookups. */
export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);
