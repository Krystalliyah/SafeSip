// src/pages/AnalyticsPage.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  LinearProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  LocalDrink,
  Warning,
  CheckCircle,
  Cancel,
  LocationOn,
} from "@mui/icons-material";

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

function monthKey(ts) {
  try {
    const d = ts?.toDate?.();
    if (!d) return null;
    return d.toISOString().slice(0, 7); // YYYY-MM
  } catch {
    return null;
  }
}

export default function AnalyticsPage() {
  const { currentUser } = useAuth();
  const [tests, setTests] = useState([]);
  const [timeRange, setTimeRange] = useState("all"); // all, month, week

  useEffect(() => {
    const unsub = subscribeToRecentTests(currentUser?.uid, 1000, setTests, console.error);
    return () => unsub?.();
  }, [currentUser?.uid]);

  const computed = useMemo(() => {
    // Filter by time range
    const now = new Date();
    let filteredTests = tests;
    
    if (timeRange === "month") {
      const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
      filteredTests = tests.filter(t => t.createdAt?.toDate() > oneMonthAgo);
    } else if (timeRange === "week") {
      const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
      filteredTests = tests.filter(t => t.createdAt?.toDate() > oneWeekAgo);
    }

    const total = filteredTests.length;
    const potable = filteredTests.filter((t) => t.prediction === "Potable").length;
    const notPotable = total - potable;
    const potableRate = total ? Math.round((potable / total) * 100) : 0;

    const confs = filteredTests.map((t) => t.confidence).filter((c) => typeof c === "number");
    const avgConf = confs.length ? Math.round((confs.reduce((a, b) => a + b, 0) / confs.length) * 100) : 0;

    // Issues analysis
    const allIssues = filteredTests.flatMap(t => t.issues || []);
    const issueCounts = {};
    allIssues.forEach(issue => {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    });
    const sortedIssues = Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Barangay analysis
    const barangayStats = {};
    filteredTests.forEach(t => {
      if (t.barangay) {
        if (!barangayStats[t.barangay]) {
          barangayStats[t.barangay] = { total: 0, potable: 0 };
        }
        barangayStats[t.barangay].total++;
        if (t.prediction === "Potable") {
          barangayStats[t.barangay].potable++;
        }
      }
    });
    const sortedBarangays = Object.entries(barangayStats)
      .map(([name, stats]) => ({
        name,
        ...stats,
        potableRate: Math.round((stats.potable / stats.total) * 100)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Daily activity
    const dailyBuckets = {};
    filteredTests.forEach((t) => {
      const k = dayKey(t.createdAt);
      if (!k) return;
      dailyBuckets[k] = (dailyBuckets[k] || 0) + 1;
    });
    const days = Object.keys(dailyBuckets).sort();
    const last30Days = days.slice(-30).map((d) => ({ day: d, count: dailyBuckets[d] }));

    // Monthly trends
    const monthlyBuckets = {};
    filteredTests.forEach((t) => {
      const k = monthKey(t.createdAt);
      if (!k) return;
      monthlyBuckets[k] = (monthlyBuckets[k] || 0) + 1;
    });
    const monthlyData = Object.entries(monthlyBuckets)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    // Parameter analysis
    const paramStats = {};
    const params = ['ph', 'hardness', 'solids', 'chloramines', 'sulfate', 'conductivity', 'organic_carbon', 'trihalomethanes', 'turbidity'];
    params.forEach(param => {
      const values = filteredTests.map(t => t.inputs?.[param]).filter(v => v != null);
      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        paramStats[param] = { average: avg, count: values.length };
      }
    });

    const maxDailyCount = last30Days.reduce((m, x) => Math.max(m, x.count), 0) || 1;

    return {
      total,
      potable,
      notPotable,
      potableRate,
      avgConf,
      sortedIssues,
      sortedBarangays,
      last30Days,
      monthlyData,
      maxDailyCount,
      paramStats,
      filteredTests
    };
  }, [tests, timeRange]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Analytics Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Insights from your water quality predictions
          </Typography>
        </Box>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
            size="small"
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="week">Last Week</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ bgcolor: "primary.light", p: 1.5, borderRadius: 2 }}>
                  <LocalDrink sx={{ color: "primary.main" }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>Total Tests</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{computed.total}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ bgcolor: "success.light", p: 1.5, borderRadius: 2 }}>
                  <CheckCircle sx={{ color: "success.main" }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>Potable Rate</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{computed.potableRate}%</Typography>
                </Box>
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={computed.potableRate} 
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ bgcolor: "info.light", p: 1.5, borderRadius: 2 }}>
                  <TrendingUp sx={{ color: "info.main" }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>Avg Confidence</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{computed.avgConf}%</Typography>
                </Box>
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={computed.avgConf} 
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ bgcolor: "warning.light", p: 1.5, borderRadius: 2 }}>
                  <Warning sx={{ color: "warning.main" }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>Issues Found</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {computed.filteredTests.filter(t => t.issues?.length > 0).length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Analytics Grid */}
      <Grid container spacing={3}>
        {/* Barangay Performance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              <LocationOn sx={{ verticalAlign: "middle", mr: 1 }} />
              Top Barangays by Tests
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {computed.sortedBarangays.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
                No barangay data available
              </Typography>
            ) : (
              <Stack spacing={2}>
                {computed.sortedBarangays.map((barangay, idx) => (
                  <Box key={barangay.name}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography sx={{ fontWeight: 600 }}>{barangay.name}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={`${barangay.potableRate}% potable`}
                          size="small"
                          color={barangay.potableRate >= 50 ? "success" : "error"}
                          variant="outlined"
                        />
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {barangay.total} tests
                        </Typography>
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={barangay.potableRate}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Common Issues */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              <Warning sx={{ verticalAlign: "middle", mr: 1 }} />
              Most Common Issues
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {computed.sortedIssues.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
                No issues detected in recent tests
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {computed.sortedIssues.map(([issue, count]) => (
                  <Stack key={issue} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontWeight: 500 }}>{issue}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {count} occurrences
                      </Typography>
                      <Chip
                        label={`${Math.round((count / computed.total) * 100)}%`}
                        size="small"
                        color="error"
                      />
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Daily Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Last 30 Days Activity
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {computed.last30Days.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
                No activity in the last 30 days
              </Typography>
            ) : (
              <Grid container spacing={0.5}>
                {computed.last30Days.map((day) => {
                  const height = Math.max(20, (day.count / computed.maxDailyCount) * 100);
                  return (
                    <Grid item xs={12 / 30} key={day.day}>
                      <Stack alignItems="center" spacing={0.5}>
                        <Box
                          sx={{
                            width: "80%",
                            height: `${height}px`,
                            bgcolor: "primary.main",
                            borderRadius: 1,
                            transition: "all 0.3s ease",
                            '&:hover': {
                              bgcolor: "primary.dark",
                            }
                          }}
                        />
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {new Date(day.day).getDate()}
                        </Typography>
                        {day.count > 0 && (
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {day.count}
                          </Typography>
                        )}
                      </Stack>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Parameter Averages */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Average Parameter Values
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {Object.keys(computed.paramStats).length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
                No parameter data available
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {Object.entries(computed.paramStats).map(([param, stats]) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={param}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: "capitalize" }}>
                          {param.replace('_', ' ')}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
                          {stats.average.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          from {stats.count} tests
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Monthly Trends */}
        {computed.monthlyData.length > 1 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Monthly Trends
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                {computed.monthlyData.map((monthData, idx) => (
                  <Grid item xs={12 / computed.monthlyData.length} key={monthData.month}>
                    <Stack alignItems="center">
                      <Typography variant="caption" sx={{ color: "text.secondary", mb: 0.5 }}>
                        {new Date(monthData.month).toLocaleDateString('en-US', { month: 'short' })}
                      </Typography>
                      <Box
                        sx={{
                          width: "60%",
                          height: `${(monthData.count / Math.max(...computed.monthlyData.map(m => m.count))) * 80}px`,
                          bgcolor: "secondary.main",
                          borderRadius: 1,
                        }}
                      />
                      <Typography variant="caption" sx={{ mt: 0.5, fontWeight: 600 }}>
                        {monthData.count}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}