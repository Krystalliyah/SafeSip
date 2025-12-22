// src/pages/PredictionPage.js
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Stack,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ScienceIcon from "@mui/icons-material/Science";

import { useAuth } from "../components/AuthContext";
import { saveTest } from "../services/testsService";
import { deriveIssues } from "../utils/issues";

const LS_LAST_INPUTS = "safesip_last_inputs_v1";
const LS_API_BASE = "safesip_api_base";

function getApiBase() {
  return localStorage.getItem(LS_API_BASE) || "http://127.0.0.1:5000";
}

const DEFAULTS = {
  ph: 7,
  hardness: 150,
  solids: 20000,
  chloramines: 7,
  sulfate: 250,
  conductivity: 400,
  organic_carbon: 12,
  trihalomethanes: 80,
  turbidity: 4,
};

export default function PredictionPage() {
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);

  const [inputs, setInputs] = useState(() => {
    // load last inputs if enabled
    try {
      const raw = localStorage.getItem(LS_LAST_INPUTS);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {}
    return DEFAULTS;
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [snack, setSnack] = useState({ open: false, msg: "", severity: "info" });
  const notify = useCallback((msg, severity = "info") => {
    setSnack({ open: true, msg, severity });
  }, []);

  const paramsList = useMemo(
    () => [
      { key: "ph", label: "pH" },
      { key: "hardness", label: "Hardness" },
      { key: "solids", label: "Solids" },
      { key: "chloramines", label: "Chloramines" },
      { key: "sulfate", label: "Sulfate" },
      { key: "conductivity", label: "Conductivity" },
      { key: "organic_carbon", label: "Organic Carbon" },
      { key: "trihalomethanes", label: "Trihalomethanes" },
      { key: "turbidity", label: "Turbidity" },
    ],
    []
  );

  const setField = useCallback((key, value) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setInputs(DEFAULTS);
    setResult(null);
    notify("Reset inputs.", "info");
  }, [notify]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportCSV = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      try {
        const text = await file.text();
        // Expect header row with keys like: ph,hardness,solids,...
        // We'll parse the first data row.
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) throw new Error("CSV must have a header and at least one row.");

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const values = lines[1].split(",").map((v) => v.trim());

        const next = { ...inputs };
        headers.forEach((h, idx) => {
          if (h in next) next[h] = Number(values[idx]);
        });

        setInputs(next);
        notify("CSV imported.", "success");
      } catch (err) {
        notify(err?.message || "Failed to import CSV.", "error");
      }
    },
    [inputs, notify]
  );

  const handlePredict = useCallback(async () => {
    if (!currentUser?.uid) {
      notify("Please log in first.", "warning");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Persist last inputs (optional)
      localStorage.setItem(LS_LAST_INPUTS, JSON.stringify(inputs));

      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Prediction failed.");

      const issues = data.issues?.length ? data.issues : deriveIssues(inputs);

      setResult({
        prediction: data.prediction,
        confidence_percent: data.confidence_percent,
        prob_potable: data.prob_potable,
        prob_not_potable: data.prob_not_potable,
        issues,
      });

      // Save to Firestore (real history)
      await saveTest({
        uid: currentUser.uid,
        inputs,
        prediction: data.prediction,
        confidence: data.confidence,
        prob_potable: data.prob_potable,
        prob_not_potable: data.prob_not_potable,
        issues,
      });

      notify("Prediction saved to history.", "success");
    } catch (err) {
      notify(err?.message || "Error predicting.", "error");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, inputs, notify]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mr: 1 }}>
          Prediction
        </Typography>
        <Chip label="ML Powered" variant="outlined" />
      </Stack>

      <Grid container spacing={3}>
        {/* Form */}
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3, borderRadius: 3 }} className="fade-in">
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Water Quality Parameters
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Enter 9 water quality parameters for potability prediction.
            </Typography>

            <Grid container spacing={2}>
              {paramsList.map((p) => (
                <Grid key={p.key} item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label={p.label}
                    value={inputs[p.key]}
                    type="number"
                    onChange={(e) => setField(p.key, e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Buttons (fixed) */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleReset}
                sx={{ flex: 1, height: 56, borderRadius: 3, fontWeight: 700, whiteSpace: "nowrap" }}
              >
                Reset
              </Button>

              <input
                ref={fileInputRef}
                hidden
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
              />
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={handleImportClick}
                sx={{ flex: 1, height: 56, borderRadius: 3, fontWeight: 700, whiteSpace: "nowrap" }}
              >
                Import CSV
              </Button>

              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ScienceIcon />}
                onClick={handlePredict}
                disabled={loading}
                sx={{
                  flex: 1.4,
                  height: 56,
                  borderRadius: 3,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  boxShadow: "0 10px 24px rgba(0, 102, 204, 0.25)",
                }}
              >
                Predict Potability
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Result */}
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3, borderRadius: 3, position: { lg: "sticky" }, top: 20 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Result
            </Typography>

            {!result ? (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No prediction yet. Enter values and click “Predict Potability”.
              </Typography>
            ) : (
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Chip
                    label={result.prediction}
                    color={result.prediction === "Potable" ? "success" : "error"}
                    variant="outlined"
                  />
                  <Chip
                    label={`${Math.round(result.confidence_percent)}% confidence`}
                    variant="outlined"
                  />
                </Stack>

                <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                  P(Potable): {Number(result.prob_potable).toFixed(3)}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  P(Not potable): {Number(result.prob_not_potable).toFixed(3)}
                </Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 2 }}>
                  Detected Issues
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                  {(result.issues || []).length ? (
                    result.issues.map((i) => <Chip key={i} label={i} size="small" />)
                  ) : (
                    <Chip label="None" size="small" variant="outlined" />
                  )}
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

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
