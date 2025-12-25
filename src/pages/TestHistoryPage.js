// src/pages/TestHistoryPage.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from "@mui/material";

import { useAuth } from "../components/AuthContext";
import { subscribeToRecentTests } from "../services/testsService";

export default function TestHistoryPage() {
  const { currentUser } = useAuth();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("TestHistoryPage - User ID:", currentUser?.uid);
    
    if (!currentUser?.uid) {
      setTests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    const unsub = subscribeToRecentTests(
      currentUser.uid,
      300,
      (data) => {
        console.log("TestHistoryPage - Received data:", data.length, "items");
        console.log("First item sample:", data[0]);
        setTests(data);
        setLoading(false);
      },
      (err) => {
        console.error("TestHistoryPage - Subscription error:", err);
        setError(err.message);
        setLoading(false);
      }
    );
    
    return () => unsub?.();
  }, [currentUser?.uid]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tests;
    return tests.filter((t) => {
      const pred = (t.prediction || "").toLowerCase();
      const issues = (t.issues || []).join(" ").toLowerCase();
      const inputs = JSON.stringify(t.inputs || {}).toLowerCase();
      const barangay = (t.barangay || "").toLowerCase();
      return pred.includes(s) || issues.includes(s) || inputs.includes(s) || barangay.includes(s);
    });
  }, [q, tests]);

  const formatDate = useCallback((ts) => {
    try {
      // Handle Firestore Timestamp
      if (ts && typeof ts.toDate === 'function') {
        return ts.toDate().toLocaleString();
      }
      // Handle timestamp object with seconds
      if (ts && ts.seconds) {
        return new Date(ts.seconds * 1000).toLocaleString();
      }
      // Handle Date object
      if (ts instanceof Date) {
        return ts.toLocaleString();
      }
      // Handle milliseconds timestamp
      if (typeof ts === 'number') {
        return new Date(ts).toLocaleString();
      }
      // Handle string
      if (typeof ts === 'string') {
        return new Date(ts).toLocaleString();
      }
      return "—";
    } catch (error) {
      console.error("Error formatting date:", error, ts);
      return "—";
    }
  }, []);

  const formatInputValue = (value) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === 'number') return value.toFixed(2);
    return String(value);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
        <Typography>Loading test history...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        Test History
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Saved predictions from Firebase ({tests.length} total)
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading tests: {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <TextField
          fullWidth
          label="Search prediction / inputs / issues / barangay"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </Paper>

      {tests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            No test history found.
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Make your first prediction on the Prediction page to see it here.
          </Typography>
        </Paper>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <Typography variant="body1">
            No results match your search.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {filtered.map((t) => {
            const confPct = typeof t.confidence === "number" ? Math.round(t.confidence * 100) : null;

            return (
              <Paper key={t.id} sx={{ p: 2, borderRadius: 3 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 800 }}>{formatDate(t.createdAt)}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Barangay: {t.barangay || "Not specified"} | 
                      Issues: {(t.issues || []).length > 0 ? (t.issues || []).join(", ") : "None"}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={t.prediction || "—"}
                      color={t.prediction === "Potable" ? "success" : "error"}
                      variant="outlined"
                    />
                    {confPct !== null && <Chip label={`${confPct}%`} variant="outlined" />}
                    <Button size="small" onClick={() => setSelected(t)}>
                      View
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        <DialogTitle>Test Details</DialogTitle>
        <DialogContent dividers>
          {!selected ? null : (
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Date: {formatDate(selected.createdAt)}
              </Typography>
              
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Barangay: {selected.barangay || "Not specified"}
              </Typography>

              <Box>
                <Typography sx={{ fontWeight: 800 }}>
                  Prediction: {selected.prediction}
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Confidence:{" "}
                {typeof selected.confidence === "number"
                  ? `${Math.round(selected.confidence * 100)}%`
                  : "—"}
              </Typography>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Issues
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
                  {(selected.issues || []).length > 0 ? (
                    selected.issues.map((issue, idx) => (
                      <Chip key={idx} label={issue} size="small" />
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      No issues detected
                    </Typography>
                  )}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Water Quality Parameters
                </Typography>
                <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  {selected.inputs ? (
                    <Stack spacing={0.5}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        pH: {formatInputValue(selected.inputs.ph)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        Hardness: {formatInputValue(selected.inputs.hardness)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        Solids: {formatInputValue(selected.inputs.solids)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        Chloramines: {formatInputValue(selected.inputs.chloramines)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        Sulfate: {formatInputValue(selected.inputs.sulfate)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        Conductivity: {formatInputValue(selected.inputs.conductivity)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        Organic Carbon: {formatInputValue(selected.inputs.organic_carbon)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        Trihalomethanes: {formatInputValue(selected.inputs.trihalomethanes)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        Turbidity: {formatInputValue(selected.inputs.turbidity)}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      No input data available
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Probabilities
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      Potable
                    </Typography>
                    <Typography variant="body2">
                      {typeof selected.prob_potable === 'number' 
                        ? selected.prob_potable.toFixed(3) 
                        : '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      Not Potable
                    </Typography>
                    <Typography variant="body2">
                      {typeof selected.prob_not_potable === 'number'
                        ? selected.prob_not_potable.toFixed(3)
                        : '—'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Debug section - remove in production */}
              <Box sx={{ mt: 2, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  Debug Info (Raw Data):
                </Typography>
                <Typography variant="caption" component="pre" sx={{ 
                  mt: 1, 
                  p: 1, 
                  bgcolor: 'white', 
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '10px'
                }}>
                  {JSON.stringify(selected, null, 2)}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}