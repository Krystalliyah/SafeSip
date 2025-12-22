// src/pages/DashboardPage.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Chip,
  LinearProgress,
  Divider,
} from "@mui/material";

import { useAuth } from "../components/AuthContext";
import { subscribeToRecentTests } from "../services/testsService";
import { deriveIssues } from "../utils/issues";

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [tests, setTests] = useState([]);

  useEffect(() => {
    const unsub = subscribeToRecentTests(
      currentUser?.uid,
      500,
      setTests,
      (err) => console.error(err)
    );
    return () => unsub?.();
  }, [currentUser?.uid]);

  const stats = useMemo(() => {
    const total = tests.length;
    const potable = tests.filter((t) => t.prediction === "Potable").length;
    const notPotable = total - potable;
    const safeRate = total ? Math.round((potable / total) * 100) : 0;

    const confs = tests.map((t) => t.confidence).filter((c) => typeof c === "number");
    const avgConf = confs.length ? Math.round((confs.reduce((a, b) => a + b, 0) / confs.length) * 100) : 0;

    const issueCounts = {};
    tests.forEach((t) => {
      const issues = (t.issues && t.issues.length) ? t.issues : deriveIssues(t.inputs || {});
      issues.forEach((iss) => {
        issueCounts[iss] = (issueCounts[iss] || 0) + 1;
      });
    });

    const commonIssues = Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count, pct: total ? Math.round((count / total) * 100) : 0 }));

    return { total, potable, notPotable, safeRate, avgConf, commonIssues };
  }, [tests]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        Dashboard
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Real data computed from your saved Firebase tests.
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1, borderRadius: 3 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>Total Tests</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{stats.total}</Typography>
        </Paper>

        <Paper sx={{ p: 2, flex: 1, borderRadius: 3 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>Safe vs Unsafe</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 1 }}>
            <Chip label={`Safe: ${stats.potable}`} color="success" variant="outlined" />
            <Chip label={`Unsafe: ${stats.notPotable}`} color="error" variant="outlined" />
          </Stack>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>Safe Rate</Typography>
          <Box sx={{ mt: 1 }}>
            <LinearProgress variant="determinate" value={stats.safeRate} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {stats.safeRate}% potable
            </Typography>
          </Box>
        </Paper>

        <Paper sx={{ p: 2, flex: 1, borderRadius: 3 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>Avg Confidence</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{stats.avgConf}%</Typography>
          <LinearProgress variant="determinate" value={stats.avgConf} />
        </Paper>
      </Stack>

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, considering: "text.primary" }}>
          Most Common Issues
        </Typography>
        <Divider sx={{ my: 2 }} />

        {stats.commonIssues.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No issues detected yet — run more tests.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {stats.commonIssues.map((iss) => (
              <Box key={iss.name}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 700 }}>{iss.name}</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {iss.count} ({iss.pct}%)
                  </Typography>
                </Stack>
                <LinearProgress variant="determinate" value={iss.pct} sx={{ mt: 1 }} />
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
