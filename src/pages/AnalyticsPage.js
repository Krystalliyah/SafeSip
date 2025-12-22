// src/pages/AnalyticsPage.js
import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, Paper, Stack, LinearProgress, Divider } from "@mui/material";

import { useAuth } from "../components/AuthContext";
import { subscribeToRecentTests } from "../services/testsService";

function dayKey(ts) {
  try {
    const d = ts?.toDate?.();
    if (!d) return null;
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  } catch {
    return null;
  }
}

export default function AnalyticsPage() {
  const { currentUser } = useAuth();
  const [tests, setTests] = useState([]);

  useEffect(() => {
    const unsub = subscribeToRecentTests(currentUser?.uid, 1000, setTests, console.error);
    return () => unsub?.();
  }, [currentUser?.uid]);

  const computed = useMemo(() => {
    const total = tests.length;
    const potable = tests.filter((t) => t.prediction === "Potable").length;
    const potableRate = total ? Math.round((potable / total) * 100) : 0;

    const confs = tests.map((t) => t.confidence).filter((c) => typeof c === "number");
    const avgConf = confs.length ? Math.round((confs.reduce((a, b) => a + b, 0) / confs.length) * 100) : 0;

    const buckets = {};
    tests.forEach((t) => {
      const k = dayKey(t.createdAt);
      if (!k) return;
      buckets[k] = (buckets[k] || 0) + 1;
    });

    const days = Object.keys(buckets).sort(); // ascending
    const last30 = days.slice(-30).map((d) => ({ day: d, count: buckets[d] }));

    const maxCount = last30.reduce((m, x) => Math.max(m, x.count), 0) || 1;

    return { total, potableRate, avgConf, last30, maxCount };
  }, [tests]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        Analytics
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Real analytics from your Firebase history.
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1, borderRadius: 3 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>Potable Rate</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{computed.potableRate}%</Typography>
          <LinearProgress variant="determinate" value={computed.potableRate} consideration />
        </Paper>

        <Paper sx={{ p: 2, flex: 1, borderRadius: 3 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>Average Confidence</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{computed.avgConf}%</Typography>
          <LinearProgress variant="determinate" value={computed.avgConf} />
        </Paper>

        <Paper sx={{ p: 2, flex: 1, borderRadius: 3 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>Total Samples</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{computed.total}</Typography>
        </Paper>
      </Stack>

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Last 30 Days Activity
        </Typography>
        <Divider sx={{ my: 2 }} />

        {computed.last30.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No activity yet — run predictions to generate analytics.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {computed.last30.map((d) => {
              const pct = Math.round((d.count / computed.maxCount) * 100);
              return (
                <Box key={d.day}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontWeight: 700 }}>{d.day}</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {d.count}
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={pct} sx={{ mt: 0.5 }} />
                </Box>
              );
            })}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
