// src/pages/SettingsPage.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Container,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";

const LS_API_BASE = "safesip_api_base";
const LS_LAST_INPUTS = "safesip_last_inputs_v1";

export default function SettingsPage() {
  const defaults = useMemo(
    () => ({
      apiBase: localStorage.getItem(LS_API_BASE) || "http://127.0.0.1:5000",
    }),
    []
  );

  const [apiBase, setApiBase] = useState(defaults.apiBase);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "info" });

  const notify = useCallback((msg, severity = "info") => {
    setSnack({ open: true, msg, severity });
  }, []);

  useEffect(() => {
    setApiBase(defaults.apiBase);
  }, [defaults.apiBase]);

  const save = useCallback(() => {
    localStorage.setItem(LS_API_BASE, apiBase.trim());
    notify("Saved API Base URL.", "success");
  }, [apiBase, notify]);

  const testConnection = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase.trim()}/health`);
      if (!res.ok) throw new Error("Health check failed.");
      notify("Backend connection OK.", "success");
    } catch (err) {
      notify(err?.message || "Backend connection failed.", "error");
    }
  }, [apiBase, notify]);

  const clearLastInputs = useCallback(() => {
    localStorage.removeItem(LS_LAST_INPUTS);
    notify("Cleared last saved inputs.", "info");
  }, [notify]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        Settings
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Configure the Flask backend used for predictions and local preferences.
      </Typography>

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Flask API Base URL"
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            helperText="Example: http://127.0.0.1:5000"
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="contained" onClick={save}>
              Save
            </Button>
            <Button variant="outlined" onClick={testConnection}>
              Test Connection
            </Button>
            <Button variant="outlined" color="warning" onClick={clearLastInputs}>
              Clear Saved Inputs
            </Button>
          </Stack>

          <Divider />

          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Note: History/Dashboard/Analytics data comes from Firebase Firestore (your account).
          </Typography>
        </Stack>
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={2600}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
