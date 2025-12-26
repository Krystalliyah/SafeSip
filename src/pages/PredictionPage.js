// src/pages/PredictionPage.js
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
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
  Autocomplete,
  Card,
  CardContent,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ScienceIcon from "@mui/icons-material/Science";
import HistoryIcon from "@mui/icons-material/History";
import { Link } from "react-router-dom";

import { useAuth } from "../components/AuthContext";
import { saveTest, getRecentPredictions } from "../services/testsService";
import { deriveIssues } from "../utils/issues";

const LS_LAST_INPUTS = "safesip_last_inputs_v2";
const LS_API_BASE = "safesip_api_base";

function getApiBase() {
  return localStorage.getItem(LS_API_BASE) || "http://127.0.0.1:5000";
}

const BARANGAYS = [
  "Abuno", "Acmac", "Bagong Silang", "Bonbonon", "Bunawan",
  "Buru-un", "Dalipuga", "Del Carmen", "Digkilaan", "Ditucalan",
  "Dulag", "Hinaplanon", "Hindang", "Kabacsanan", "Kalilangan",
  "Kiwalan", "Lanipao", "Luinab", "Mahayhay", "Mainit",
  "Mandulog", "Maria Cristina", "Palao", "Panoroganan", "Poblacion",
  "Puga-an", "Rogongon", "San Miguel", "San Roque", "Santa Elena",
  "Santa Filomena", "Santiago", "Santo Rosario", "Saray-Tibanga", "Suarez",
  "Tambacan", "Tibanga", "Tipanoy", "Tominobo Proper", "Tominobo Upper",
  "Tubod", "Ubaldo Laya", "Upper Hinaplanon", "Villa Verde"
];

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
  barangay: "",
};

export default function PredictionPage() {
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);

  const [inputs, setInputs] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_LAST_INPUTS);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {}
    return DEFAULTS;
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // CHANGED: Start with null, don't load from localStorage
  const [recentPredictions, setRecentPredictions] = useState([]);

  const [snack, setSnack] = useState({ open: false, msg: "", severity: "info" });
  const notify = useCallback((msg, severity = "info") => {
    setSnack({ open: true, msg, severity });
  }, []);

  const loadRecentPredictions = useCallback(async () => {
    if (!currentUser?.uid) {
      setRecentPredictions([]);
      return;
    }
    try {
      console.log("Loading recent predictions for user:", currentUser.uid);
      const recent = await getRecentPredictions(currentUser.uid, 5);
      console.log("Loaded recent predictions:", recent);
      setRecentPredictions(recent);
    } catch (error) {
      console.error("Failed to load recent predictions:", error);
      setRecentPredictions([]);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    loadRecentPredictions();
  }, [loadRecentPredictions]);

  useEffect(() => {
    if (currentUser?.uid) {
      loadRecentPredictions();
    } else {
      setRecentPredictions([]);
    }
  }, [currentUser?.uid]);

  const paramsList = useMemo(
    () => [
      { key: "ph", label: "pH", unit: "", ideal: "6.5-8.5" },
      { key: "hardness", label: "Hardness", unit: "mg/L", ideal: "≤500" },
      { key: "solids", label: "Solids", unit: "mg/L", ideal: "≤5000" },
      { key: "chloramines", label: "Chloramines", unit: "mg/L", ideal: "≤4" },
      { key: "sulfate", label: "Sulfate", unit: "mg/L", ideal: "≤250" },
      { key: "conductivity", label: "Conductivity", unit: "μS/cm", ideal: "≤400" },
      { key: "organic_carbon", label: "Organic Carbon", unit: "mg/L", ideal: "≤10" },
      { key: "trihalomethanes", label: "Trihalomethanes", unit: "μg/L", ideal: "≤80" },
      { key: "turbidity", label: "Turbidity", unit: "NTU", ideal: "≤5" },
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

    if (!inputs.barangay) {
      notify("Please select a barangay.", "warning");
      return;
    }

    const validationErrors = [];
    paramsList.forEach(param => {
      const value = inputs[param.key];
      if (value === undefined || value === null || value === "") {
        validationErrors.push(`${param.label} is required`);
      } else if (isNaN(Number(value))) {
        validationErrors.push(`${param.label} must be a number`);
      }
    });

    if (validationErrors.length > 0) {
      notify(`Please fix errors: ${validationErrors.join(", ")}`, "error");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      localStorage.setItem(LS_LAST_INPUTS, JSON.stringify(inputs));

      const apiBase = getApiBase();
      console.log("Sending request to:", `${apiBase}/predict`);
      const res = await fetch(`${apiBase}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ph: parseFloat(inputs.ph) || 0,
          hardness: parseFloat(inputs.hardness) || 0,
          solids: parseFloat(inputs.solids) || 0,
          chloramines: parseFloat(inputs.chloramines) || 0,
          sulfate: parseFloat(inputs.sulfate) || 0,
          conductivity: parseFloat(inputs.conductivity) || 0,
          organic_carbon: parseFloat(inputs.organic_carbon) || 0,
          trihalomethanes: parseFloat(inputs.trihalomethanes) || 0,
          turbidity: parseFloat(inputs.turbidity) || 0,
        }),
      });

      console.log("Response status:", res.status);
      const data = await res.json().catch(() => ({}));
      console.log("Response data:", data);
      
      if (!res.ok) throw new Error(data?.error || "Prediction failed.");

      const issues = data.issues?.length ? data.issues : deriveIssues(inputs);

      const predictionResult = {
        prediction: data.prediction || "Unknown",
        confidence_percent: data.confidence_percent || 0,
        prob_potable: data.prob_potable || 0,
        prob_not_potable: data.prob_not_potable || 0,
        issues,
        barangay: inputs.barangay,
        timestamp: new Date(),
      };

      setResult(predictionResult);
      // REMOVED: localStorage.setItem(LS_LAST_RESULT, JSON.stringify(predictionResult));

      const saveData = {
        uid: currentUser.uid,
        inputs: {
          ph: parseFloat(inputs.ph) || 0,
          hardness: parseFloat(inputs.hardness) || 0,
          solids: parseFloat(inputs.solids) || 0,
          chloramines: parseFloat(inputs.chloramines) || 0,
          sulfate: parseFloat(inputs.sulfate) || 0,
          conductivity: parseFloat(inputs.conductivity) || 0,
          organic_carbon: parseFloat(inputs.organic_carbon) || 0,
          trihalomethanes: parseFloat(inputs.trihalomethanes) || 0,
          turbidity: parseFloat(inputs.turbidity) || 0,
        },
        barangay: inputs.barangay,
        prediction: data.prediction || "Unknown",
        confidence: (data.confidence_percent || 0) / 100,
        prob_potable: data.prob_potable || 0,
        prob_not_potable: data.prob_not_potable || 0,
        issues,
      };

      console.log("Saving to Firestore:", saveData);
      await saveTest(saveData);

      setTimeout(() => {
        loadRecentPredictions();
      }, 1000);

      notify("Prediction saved to history.", "success");
    } catch (err) {
      console.error("Prediction error:", err);
      notify(err?.message || "Error predicting.", "error");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, inputs, notify, loadRecentPredictions, paramsList]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mr: 1 }}>
          Water Potability Prediction
        </Typography>
       
      </Stack>

      <Grid container spacing={3}>
        {/* Form Section */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }} className="fade-in">
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Water Quality Parameters
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Enter water quality parameters and select barangay for potability prediction.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Autocomplete
                freeSolo
                options={BARANGAYS}
                value={inputs.barangay}
                onChange={(_, newValue) => setField("barangay", newValue || "")}
                onInputChange={(_, newValue) => setField("barangay", newValue || "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Barangay in Iligan City"
                    placeholder="Type or select a barangay"
                    required
                  />
                )}
              />
            </Box>

            <Grid container spacing={2}>
              {paramsList.map((p) => (
                <Grid key={p.key} item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label={`${p.label} ${p.unit ? `(${p.unit})` : ""}`}
                    value={inputs[p.key]}
                    type="number"
                    helperText={`Ideal: ${p.ideal}`}
                    onChange={(e) => setField(p.key, e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </Grid>
              ))}
            </Grid>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleReset}
                sx={{ flex: 1, height: 56, borderRadius: 3, fontWeight: 700 }}
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
                sx={{ flex: 1, height: 56, borderRadius: 3, fontWeight: 700 }}
              >
                Import CSV
              </Button>

              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ScienceIcon />}
                onClick={handlePredict}
                disabled={loading || !inputs.barangay}
                sx={{
                  flex: 1.4,
                  height: 56,
                  borderRadius: 3,
                  fontWeight: 800,
                  boxShadow: "0 10px 24px rgba(0, 102, 204, 0.25)",
                }}
              >
                Predict Potability
              </Button>
            </Stack>
          </Paper>

          {/* Prediction Result - Shows ONLY after prediction, ABOVE Recent Predictions */}
          {result ? (
            <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Prediction Result
              </Typography>

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {result.barangay}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {result.timestamp?.toLocaleDateString?.() || new Date().toLocaleDateString()}{" "}
                    {result.timestamp?.toLocaleTimeString?.() || new Date().toLocaleTimeString()}
                  </Typography>
                </Box>
                <Chip
                  label={result.prediction}
                  color={result.prediction === "Potable" ? "success" : "error"}
                  size="medium"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>

              <Box sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2">Confidence</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {Math.round(result.confidence_percent || 0)}%
                  </Typography>
                </Stack>
                <Box sx={{ position: "relative", height: 8, bgcolor: "grey.200", borderRadius: 4, overflow: "hidden" }}>
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      height: "100%",
                      width: `${Math.min(result.confidence_percent || 0, 100)}%`,
                      bgcolor: result.prediction === "Potable" ? "success.main" : "error.main",
                      borderRadius: 4,
                    }}
                  />
                </Box>
              </Box>

              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, textAlign: "center", bgcolor: "success.light" }}>
                    <Typography variant="caption" sx={{ display: "block", color: "success.dark" }}>
                      Potable
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "success.dark" }}>
                      {((result.prob_potable || 0) * 100).toFixed(1)}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, textAlign: "center", bgcolor: "error.light" }}>
                    <Typography variant="caption" sx={{ display: "block", color: "error.dark" }}>
                      Not Potable
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "error.dark" }}>
                      {((result.prob_not_potable || 0) * 100).toFixed(1)}%
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                Detected Issues
              </Typography>
              <Stack spacing={0.5}>
                {(result.issues || []).length > 0 ? (
                  result.issues.map((issue, idx) => (
                    <Chip
                      key={idx}
                      label={issue}
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{ width: "fit-content" }}
                    />
                  ))
                ) : (
                  <Chip
                    label="No issues detected"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ width: "fit-content" }}
                  />
                )}
              </Stack>
            </Paper>
          ) : (
            <Paper 
              sx={{ 
                p: 4, 
                borderRadius: 3, 
                mt: 3,
                textAlign: "center",
                bgcolor: "primary.light",
                border: "2px dashed",
                borderColor: "primary.main"
              }}
            >
              <ScienceIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: "primary.dark" }}>
                Predict Now!
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Fill in the parameters above and click "Predict Potability" to see your results here.
              </Typography>
            </Paper>
          )}

          {/* Recent Predictions Section */}
          <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Recent Predictions
              </Typography>
              <Button
                component={Link}
                to="/history"
                startIcon={<HistoryIcon />}
                variant="outlined"
                size="small"
              >
                See All
              </Button>
            </Stack>

            {recentPredictions.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 2 }}>
                No recent predictions. Make your first prediction!
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {recentPredictions.map((pred, index) => (
                  <Grid item xs={12} sm={6} key={pred.id || index}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {pred.barangay || "Unknown Barangay"}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {pred.createdAt?.toDate?.().toLocaleDateString() || new Date().toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Chip
                            label={pred.prediction || "Unknown"}
                            color={pred.prediction === "Potable" ? "success" : "error"}
                            size="small"
                          />
                        </Stack>
                        <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                          Confidence: {pred.confidence ? Math.round(pred.confidence * 100) : "—"}%
                        </Typography>
                        {pred.issues?.length > 0 && (
                          <Typography variant="caption" sx={{ color: "error.main", display: "block", mt: 0.5 }}>
                            {pred.issues.length} issue(s)
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
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