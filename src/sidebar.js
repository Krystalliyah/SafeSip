import React, { useMemo, useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer,
  Toolbar,
  Box,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import ScienceIcon from "@mui/icons-material/Science";
import HistoryIcon from "@mui/icons-material/History";
import InsightsIcon from "@mui/icons-material/Insights";
import SettingsIcon from "@mui/icons-material/Settings";

const DRAWER_WIDTH = 280;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [snack, setSnack] = useState({
    open: false,
    msg: "",
    severity: "info",
  });

  const showSnack = useCallback((msg, severity = "info") => {
    setSnack({ open: true, msg, severity });
  }, []);

  const closeSnack = useCallback(() => {
    setSnack((s) => ({ ...s, open: false }));
  }, []);

  const items = useMemo(
    () => [
      { label: "Predict", path: "/", icon: <ScienceIcon /> },
      { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
      { label: "History", path: "/history", icon: <HistoryIcon /> },
      { label: "Analytics", path: "/analytics", icon: <InsightsIcon /> },
      { label: "Settings", path: "/settings", icon: <SettingsIcon /> },
    ],
    []
  );

  const handleNav = useCallback(
    (path) => {
      // Optional: give feedback if clicking same page
      if (location.pathname === path) {
        showSnack("You're already on this page.", "info");
        return;
      }
      navigate(path);
    },
    [location.pathname, navigate, showSnack]
  );

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "1px solid rgba(0,0,0,0.08)",
          },
        }}
      >
        <Toolbar />

        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
            SafeSip
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Water Potability Tools
          </Typography>
        </Box>

        <Divider />

        <List sx={{ px: 1, py: 1 }}>
          {items.map((item) => {
            // "/" must match exactly, others can match prefix (so /history/123 still highlights History)
            const selected =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <ListItemButton
                key={item.path}
                selected={selected}
                onClick={() => handleNav(item.path)}
                sx={{ borderRadius: 2, mx: 1, my: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: selected ? 700 : 600 }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <Box sx={{ flexGrow: 1 }} />
      </Drawer>

      <Snackbar
        open={snack.open}
        autoHideDuration={2200}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={closeSnack} severity={snack.severity} variant="filled">
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
