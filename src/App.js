// App.js
import React, { useCallback, useState, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { Box, CssBaseline, Typography, CircularProgress } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import Sidebar from "./components/sidebar";
import Header from "./components/Header";
import { useAuth } from "./components/AuthContext";
import "./App.css";

// ✅ Pages (lazy)
const PredictionPage = lazy(() => import("./pages/PredictionPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const TestHistoryPage = lazy(() => import("./pages/TestHistoryPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const DRAWER_WIDTH = 280;

const theme = createTheme({
  palette: {
    primary: { main: "#0066cc", light: "#4d94ff", dark: "#004999" },
    secondary: { main: "#00a86b" },
    warning: { main: "#ff9800" },
    error: { main: "#f44336" },
    background: { default: "#f0f9ff", paper: "#ffffff" },
  },
  typography: {
    fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: "2.5rem" },
    h2: { fontWeight: 600, fontSize: "2rem" },
    h3: { fontWeight: 600, fontSize: "1.75rem" },
    h4: { fontWeight: 600, fontSize: "1.5rem" },
    h5: { fontWeight: 500, fontSize: "1.25rem" },
    h6: { fontWeight: 500, fontSize: "1rem" },
    body1: { fontWeight: 400, fontSize: "1rem" },
    body2: { fontWeight: 400, fontSize: "0.875rem" },
    button: { fontWeight: 600, textTransform: "none" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: "10px 24px", fontWeight: 600 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: { "& .MuiOutlinedInput-root": { borderRadius: 8 } },
      },
    },
  },
});

function LoadingScreen({ label = "Loading..." }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <CircularProgress size={22} />
        <Typography variant="body1">{label}</Typography>
      </Box>
    </Box>
  );
}

function Welcome() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 64px)",
        px: 2,
        textAlign: "center",
      }}
    >
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: "primary.main" }}>
        Welcome to SafeSip
      </Typography>
      <Typography variant="body1" sx={{ maxWidth: 520, color: "text.secondary" }}>
        Please log in or create an account to use the water potability prediction tools.
        If the login window is closed, click the avatar in the header.
      </Typography>
    </Box>
  );
}

function RequireAuth({ isAuthed }) {
  const location = useLocation();
  if (!isAuthed) return <Navigate to="/welcome" replace state={{ from: location }} />;
  return <Outlet />;
}

function AppShell() {
  const [predictionResult, setPredictionResult] = useState(null);
  const { currentUser, authLoading } = useAuth();

  const handlePrediction = useCallback((result) => {
    setPredictionResult(result);
  }, []);

  if (authLoading) return <LoadingScreen label="Checking authentication..." />;

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />

        {/* Sidebar only when logged in */}
        {currentUser && <Sidebar />}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: currentUser ? { xs: 0, md: `${DRAWER_WIDTH}px` } : 0,
            minHeight: "100vh",
            bgcolor: "background.default",
            position: "relative",
          }}
        >
          {/* Header always visible */}
          <Header forceAuthOnStart={!currentUser} />

          <Suspense fallback={<LoadingScreen label="Loading page..." />}>
            <Routes>
              {/* Public */}
              <Route path="/welcome" element={<Welcome />} />

              {/* Private */}
              <Route element={<RequireAuth isAuthed={!!currentUser} />}>
                <Route
                  path="/"
                  element={
                    <PredictionPage
                      onPredict={handlePrediction}
                      result={predictionResult}
                    />
                  }
                />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/history" element={<TestHistoryPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route
                path="*"
                element={<Navigate to={currentUser ? "/" : "/welcome"} replace />}
              />
            </Routes>
          </Suspense>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}
