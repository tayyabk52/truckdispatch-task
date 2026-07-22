import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "@/components/layout/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import PlanTripPage from "@/pages/PlanTripPage";
import TripResultsPage from "@/pages/TripResultsPage";
import LogViewerPage from "@/pages/LogViewerPage";
import HistoryPage from "@/pages/HistoryPage";
import HosGuidePage from "@/pages/HosGuidePage";
import SettingsPage from "@/pages/SettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import theme from "@/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            {/* Every page renders inside the shared app shell. */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/plan" element={<PlanTripPage />} />
              <Route path="/trips/:id" element={<TripResultsPage />} />
              <Route path="/trips/:id/logs" element={<LogViewerPage />} />
              <Route path="/trips/:id/logs/:date" element={<LogViewerPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/hos-guide" element={<HosGuidePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              {/* Legacy path: keep /about working by redirecting. */}
              <Route path="/about" element={<Navigate to="/hos-guide" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
