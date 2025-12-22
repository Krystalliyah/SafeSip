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
} from "@mui/material";

import { useAuth } from "../components/AuthContext";
import { subscribeToRecentTests } from "../services/testsService";

export default function TestHistoryPage() {
  const { currentUser } = useAuth();

  const [tests, setTests] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const unsub = subscribeToRecentTests(
      currentUser?.uid,
      300,
      setTests,
      (err) => console.error(err)
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
      return pred.includes(s) || issues.includes(s) || inputs.includes(s);
    });
  }, [q, tests]);

  const formatDate = useCallback((ts) => {
    try {
      return ts?.toDate?.().toLocaleString() || "—";
    } catch {
      return "—";
    }
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        Test History
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Saved predictions from Firebase (your account only).
      </Typography>

      <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <TextField
          fullWidth
          label="Search prediction / inputs / issues"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </Paper>

      <Stack spacing={2}>
        {filtered.map((t) => {
          const confPct = typeof t.confidence === "number" ? Math.round(t.confidence * 100) : null;

          return (
            <Paper key={t.id} sx={{ p: 2, borderRadius: 3 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={1}
              >
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>{formatDate(t.createdAt)}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Issues: {(t.issues || []).join(", ") || "None"}
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

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Test Details</DialogTitle>
        <DialogContent dividers>
          {!selected ? null : (
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Date: {formatDate(selected.createdAt)}
              </Typography>

              <Typography sx={{ fontWeight: 800 }}>
                Prediction: {selected.prediction}
              </Typography>

              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Confidence:{" "}
                {typeof selected.confidence === "number"
                  ? `${Math.round(selected.confidence * 100)}%`
                  : "—"}
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1 }}>
                Inputs
              </Typography>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(selected.inputs || {}, null, 2)}
              </pre>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1 }}>
                Probabilities
              </Typography>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(
                  {
                    prob_potable: selected.prob_potable,
                    prob_not_potable: selected.prob_not_potable,
                  },
                  null,
                  2
                )}
              </pre>
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
