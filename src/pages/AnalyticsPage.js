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
  useTheme,
  alpha,
  Tooltip,
} from "@mui/material";
import {
  TrendingUp,
  LocalDrink,
  Warning,
  CheckCircle,
  LocationOn,
  CalendarMonth,
  Science,
} from "@mui/icons-material";

import { useAuth } from "../components/AuthContext";
import { subscribeToRecentTests } from "../services/testsService";

function dayKey(ts) {
  try {
    const d = ts?.toDate?.();
    if (!d) return null;
    
    // Use LOCAL date from the timestamp (not UTC)
    const localYear = d.getFullYear();
    const localMonth = String(d.getMonth() + 1).padStart(2, '0');
    const localDay = String(d.getDate()).padStart(2, '0');
    return `${localYear}-${localMonth}-${localDay}`;
  } catch {
    return null;
  }
}

function monthKey(ts) {
  try {
    const d = ts?.toDate?.();
    if (!d) return null;
    // Use local month
    const localYear = d.getFullYear();
    const localMonth = String(d.getMonth() + 1).padStart(2, '0');
    return `${localYear}-${localMonth}`;
  } catch {
    return null;
  }
}

export default function AnalyticsPage() {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const [tests, setTests] = useState([]);
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    const unsub = subscribeToRecentTests(currentUser?.uid, 1000, setTests, console.error);
    return () => unsub?.();
  }, [currentUser?.uid]);

  const computed = useMemo(() => {
    const now = new Date();
    let filteredTests = tests;
    
    if (timeRange === "month") {
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filteredTests = tests.filter(t => t.createdAt?.toDate() > oneMonthAgo);
    } else if (timeRange === "week") {
      const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
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
      .slice(0, 6);

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
      .slice(0, 8);

    // Daily activity - last 30 days
    const dailyBuckets = {};
    const today = new Date();
    
    // Initialize last 30 days with 0 counts - use LOCAL date consistently
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const localYear = date.getFullYear();
      const localMonth = String(date.getMonth() + 1).padStart(2, '0');
      const localDay = String(date.getDate()).padStart(2, '0');
      const key = `${localYear}-${localMonth}-${localDay}`;
      dailyBuckets[key] = 0;
    }
    
    // Fill in actual counts - dayKey uses LOCAL date
    filteredTests.forEach((t) => {
      const k = dayKey(t.createdAt);
      if (k && dailyBuckets.hasOwnProperty(k)) {
        dailyBuckets[k]++;
      }
    });
    
    const last30Days = Object.keys(dailyBuckets)
      .sort()
      .map((d) => ({ day: d, count: dailyBuckets[d] }));

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
        const min = Math.min(...values);
        const max = Math.max(...values);
        paramStats[param] = { average: avg, count: values.length, min, max };
      }
    });

    const maxDailyCount = Math.max(...last30Days.map(x => x.count), 1);

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

  const StatCard = ({ icon, label, value, subtitle, color = "primary", progress }) => (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        borderRadius: 3,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        }
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
              {label}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: `${color}.main` }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box 
            sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: alpha(theme.palette[color].main, 0.15),
              color: `${color}.main`
            }}
          >
            {icon}
          </Box>
        </Stack>
        {progress !== undefined && (
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 6, 
              borderRadius: 3,
              bgcolor: alpha(theme.palette[color].main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                bgcolor: `${color}.main`
              }
            }} 
          />
        )}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: 'primary.main' }}>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Comprehensive insights from {computed.total} water quality predictions
          </Typography>
        </Box>
        
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="week">Last Week</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<LocalDrink sx={{ fontSize: 28 }} />}
            label="Total Tests"
            value={computed.total}
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<CheckCircle sx={{ fontSize: 28 }} />}
            label="Potable Rate"
            value={`${computed.potableRate}%`}
            subtitle={`${computed.potable} of ${computed.total} safe`}
            color="success"
            progress={computed.potableRate}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<TrendingUp sx={{ fontSize: 28 }} />}
            label="Avg Confidence"
            value={`${computed.avgConf}%`}
            subtitle="Model certainty"
            color="info"
            progress={computed.avgConf}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<Warning sx={{ fontSize: 28 }} />}
            label="Tests with Issues"
            value={computed.filteredTests.filter(t => t.issues?.length > 0).length}
            subtitle={`${computed.sortedIssues.length} unique issues`}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Detailed Analytics Grid */}
      <Grid container spacing={3}>
        {/* Barangay Performance */}
        <Grid item xs={12} lg={6}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3, 
              height: "100%",
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, white 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <LocationOn sx={{ fontSize: 28, color: 'primary.main' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Top Barangays by Tests
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Water quality by location
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 2.5 }} />
            
            {computed.sortedBarangays.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <LocationOn sx={{ fontSize: 48, color: alpha(theme.palette.primary.main, 0.3), mb: 2 }} />
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  No barangay data available
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Start adding barangay information to your tests
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2.5}>
                {computed.sortedBarangays.map((barangay, idx) => (
                  <Paper
                    key={barangay.name}
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      bgcolor: alpha(theme.palette.primary.main, 0.03),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip 
                          label={`#${idx + 1}`} 
                          size="small" 
                          sx={{ 
                            fontWeight: 700,
                            bgcolor: alpha(theme.palette.primary.main, 0.15),
                            color: 'primary.dark'
                          }} 
                        />
                        <Typography sx={{ fontWeight: 700 }}>{barangay.name}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Chip
                          label={`${barangay.potableRate}%`}
                          size="small"
                          color={barangay.potableRate >= 70 ? "success" : barangay.potableRate >= 40 ? "warning" : "error"}
                          sx={{ fontWeight: 700, minWidth: 60 }}
                        />
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {barangay.total} tests
                        </Typography>
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={barangay.potableRate}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.grey[400], 0.2),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: barangay.potableRate >= 70 ? 'success.main' : barangay.potableRate >= 40 ? 'warning.main' : 'error.main'
                        }
                      }}
                    />
                  </Paper>
                ))}
              </Stack>
            )}
            
            {/* Choropleth Map Suggestion */}
            {computed.sortedBarangays.length > 0 && (
              <Box 
                sx={{ 
                  mt: 3, 
                  p: 2, 
                  bgcolor: alpha(theme.palette.info.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  borderRadius: 2 
                }}
              >
                <Typography variant="caption" sx={{ color: 'info.dark', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  💡 Enhancement Suggestion
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Consider adding a choropleth map showing water quality across Iligan City barangays. 
                  You'll need GeoJSON data for Iligan City barangays and can use libraries like Leaflet or Mapbox GL JS.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Common Issues */}
        <Grid item xs={12} lg={6}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3, 
              height: "100%",
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.02)} 0%, white 100%)`,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Warning sx={{ fontSize: 28, color: 'warning.main' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Most Common Issues
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Frequent water quality problems
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 2.5 }} />
            
            {computed.sortedIssues.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CheckCircle sx={{ fontSize: 48, color: alpha(theme.palette.success.main, 0.5), mb: 2 }} />
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  No issues detected
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  All tests are showing good water quality!
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {computed.sortedIssues.map(([issue, count], idx) => {
                  const percentage = Math.round((count / computed.total) * 100);
                  return (
                    <Paper
                      key={issue}
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        bgcolor: alpha(theme.palette.warning.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip 
                            label={`#${idx + 1}`} 
                            size="small" 
                            sx={{ 
                              fontWeight: 700,
                              bgcolor: alpha(theme.palette.warning.main, 0.2),
                              color: 'warning.dark'
                            }} 
                          />
                          <Typography sx={{ fontWeight: 700 }}>{issue}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {count} times
                          </Typography>
                          <Chip
                            label={`${percentage}%`}
                            size="small"
                            color="warning"
                            sx={{ fontWeight: 700, minWidth: 60 }}
                          />
                        </Stack>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: 'warning.main'
                          }
                        }}
                      />
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Daily Activity */}
        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, white 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <CalendarMonth sx={{ fontSize: 28, color: 'primary.main' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Last 30 Days Activity
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Daily test frequency - hover for details
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 3 }} />
            
            {computed.last30Days.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CalendarMonth sx={{ fontSize: 48, color: alpha(theme.palette.primary.main, 0.3), mb: 2 }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  No activity in the last 30 days
                </Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto', pb: 2 }}>
                <Stack direction="row" spacing={0.5} sx={{ minWidth: 'max-content' }}>
                  {computed.last30Days.map((day) => {
                    const height = Math.max(30, (day.count / computed.maxDailyCount) * 120);
                    const date = new Date(day.day + 'T00:00:00'); // Add time to parse correctly
                    
                    // Get today's date string using the same logic as dayKey
                    const today = new Date();
                    const todayYear = today.getFullYear();
                    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
                    const todayDay = String(today.getDate()).padStart(2, '0');
                    const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;
                    
                    const isToday = day.day === todayStr;
                    
                    return (
                      <Tooltip 
                        key={day.day} 
                        title={
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Typography>
                            <Typography variant="caption">
                              {day.count} {day.count === 1 ? 'test' : 'tests'}
                            </Typography>
                          </Box>
                        }
                        arrow
                      >
                        <Stack 
                          alignItems="center" 
                          spacing={0.5} 
                          sx={{ 
                            minWidth: 28,
                            cursor: 'pointer'
                          }}
                        >
                          <Box
                            sx={{
                              width: 20,
                              height: `${height}px`,
                              bgcolor: day.count === 0 
                                ? alpha(theme.palette.grey[400], 0.2)
                                : isToday 
                                  ? 'secondary.main'
                                  : 'primary.main',
                              borderRadius: 1,
                              transition: 'all 0.2s ease',
                              border: isToday ? `2px solid ${theme.palette.secondary.dark}` : 'none',
                              '&:hover': {
                                bgcolor: day.count === 0 
                                  ? alpha(theme.palette.grey[400], 0.3)
                                  : isToday 
                                    ? 'secondary.dark'
                                    : 'primary.dark',
                                transform: 'scaleY(1.05)',
                              }
                            }}
                          />
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: "text.secondary",
                              fontSize: '10px',
                              fontWeight: isToday ? 700 : 400
                            }}
                          >
                            {date.getDate()}
                          </Typography>
                        </Stack>
                      </Tooltip>
                    );
                  })}
                </Stack>
                <Stack direction="row" spacing={3} sx={{ mt: 2, justifyContent: 'center' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 12, height: 12, bgcolor: 'primary.main', borderRadius: 0.5 }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Past days</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 12, height: 12, bgcolor: 'secondary.main', borderRadius: 0.5, border: `2px solid ${theme.palette.secondary.dark}` }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Today</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 12, height: 12, bgcolor: alpha(theme.palette.grey[400], 0.2), borderRadius: 0.5 }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>No tests</Typography>
                  </Stack>
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Parameter Averages */}
        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.02)} 0%, white 100%)`,
              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Science sx={{ fontSize: 28, color: 'info.main' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Average Parameter Values
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Statistical overview of water quality metrics
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 3 }} />
            
            {Object.keys(computed.paramStats).length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Science sx={{ fontSize: 48, color: alpha(theme.palette.info.main, 0.3), mb: 2 }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  No parameter data available
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {Object.entries(computed.paramStats).map(([param, stats]) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={param}>
                    <Card 
                      sx={{ 
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: theme.palette.info.main,
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4]
                        }
                      }}
                    >
                      <CardContent>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 700, 
                            mb: 1.5, 
                            textTransform: "capitalize",
                            color: 'info.dark'
                          }}
                        >
                          {param.replace('_', ' ')}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: "info.main", mb: 0.5 }}>
                          {stats.average.toFixed(2)}
                        </Typography>
                        <Stack direction="row" spacing={1} mb={1}>
                          <Chip 
                            label={`Min: ${stats.min.toFixed(2)}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '10px' }}
                          />
                          <Chip 
                            label={`Max: ${stats.max.toFixed(2)}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '10px' }}
                          />
                        </Stack>
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
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.02)} 0%, white 100%)`,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Monthly Trends
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 2 }}>
                {computed.monthlyData.map((monthData) => {
                  const maxCount = Math.max(...computed.monthlyData.map(m => m.count));
                  const height = (monthData.count / maxCount) * 100;
                  
                  return (
                    <Stack key={monthData.month} alignItems="center" sx={{ minWidth: 80 }}>
                      <Tooltip title={`${monthData.count} tests`} arrow>
                        <Box
                          sx={{
                            width: 60,
                            height: `${height}px`,
                            minHeight: 40,
                            bgcolor: "secondary.main",
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'secondary.dark',
                              transform: 'scaleY(1.05)'
                            }
                          }}
                        >
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 700 }}>
                            {monthData.count}
                          </Typography>
                        </Box>
                      </Tooltip>
                      <Typography variant="caption" sx={{ mt: 1, color: "text.secondary", fontWeight: 600 }}>
                        {new Date(monthData.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}