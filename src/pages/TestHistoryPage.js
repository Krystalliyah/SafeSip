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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Search,
  FilterList,
  Sort,
  CalendarToday,
  WaterDrop,
  TrendingUp,
  Close,
} from "@mui/icons-material";

import { useAuth } from "../components/AuthContext";
import { subscribeToRecentTests } from "../services/testsService";

export default function TestHistoryPage() {
  const { currentUser } = useAuth();
  const theme = useTheme();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("date-desc");
  const [filterBy, setFilterBy] = useState("all");

  const getTimestamp = useCallback((ts) => {
    try {
      if (ts && typeof ts.toDate === 'function') return ts.toDate().getTime();
      if (ts && ts.seconds) return ts.seconds * 1000;
      if (ts instanceof Date) return ts.getTime();
      if (typeof ts === 'number') return ts;
      return 0;
    } catch {
      return 0;
    }
  }, []);

  const formatDate = useCallback((ts) => {
    try {
      let date;
      if (ts && typeof ts.toDate === 'function') {
        date = ts.toDate();
      } else if (ts && ts.seconds) {
        date = new Date(ts.seconds * 1000);
      } else if (ts instanceof Date) {
        date = ts;
      } else if (typeof ts === 'number') {
        date = new Date(ts);
      } else if (typeof ts === 'string') {
        date = new Date(ts);
      } else {
        return "—";
      }
      
      const options = { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return date.toLocaleString('en-US', options);
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
    let result = [...tests];

    // Apply filter
    if (filterBy === "potable") {
      result = result.filter(t => t.prediction === "Potable");
    } else if (filterBy === "not-potable") {
      result = result.filter(t => t.prediction !== "Potable");
    } else if (filterBy === "has-issues") {
      result = result.filter(t => t.issues && t.issues.length > 0);
    }

    // Apply search
    const s = q.trim().toLowerCase();
    if (s) {
      result = result.filter((t) => {
        const pred = (t.prediction || "").toLowerCase();
        const issues = (t.issues || []).join(" ").toLowerCase();
        const inputs = JSON.stringify(t.inputs || {}).toLowerCase();
        const barangay = (t.barangay || "").toLowerCase();
        return pred.includes(s) || issues.includes(s) || inputs.includes(s) || barangay.includes(s);
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
        case "date-asc":
          return getTimestamp(a.createdAt) - getTimestamp(b.createdAt);
        case "confidence-desc":
          return (b.confidence || 0) - (a.confidence || 0);
        case "confidence-asc":
          return (a.confidence || 0) - (b.confidence || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [q, tests, sortBy, filterBy, getTimestamp]);

  const stats = useMemo(() => {
    return {
      total: tests.length,
      potable: tests.filter(t => t.prediction === "Potable").length,
      notPotable: tests.filter(t => t.prediction !== "Potable").length,
      avgConf: tests.length > 0 
        ? Math.round((tests.reduce((sum, t) => sum + (t.confidence || 0), 0) / tests.length) * 100)
        : 0
    };
  }, [tests]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
        <Typography>Loading test history...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: 'primary.main' }}>
          Test History
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Complete record of all water quality predictions
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Error loading tests: {error}
        </Alert>
      )}

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Total Tests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main' }}>
                {stats.potable}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Safe Water
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main' }}>
                {stats.notPotable}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Unsafe Water
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'info.main' }}>
                {stats.avgConf}%
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Avg Confidence
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

     {/* Search and Filter Controls */}
      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
          {/* Search Bar - Takes up more space */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <TextField
              fullWidth
              placeholder="Search by prediction, barangay, issues, or parameters..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: q && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setQ("")}>
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Box>

          {/* Filter and Sort - On the right side */}
          <Stack direction="row" spacing={2} sx={{ minWidth: { xs: '100%', md: 'auto' } }}>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Filter By</InputLabel>
              <Select
                value={filterBy}
                label="Filter By"
                onChange={(e) => setFilterBy(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterList sx={{ color: 'text.secondary', ml: 1 }} />
                  </InputAdornment>
                }
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Tests</MenuItem>
                <MenuItem value="potable">Safe Only</MenuItem>
                <MenuItem value="not-potable">Unsafe Only</MenuItem>
                <MenuItem value="has-issues">With Issues</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <Sort sx={{ color: 'text.secondary', ml: 1 }} />
                  </InputAdornment>
                }
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="date-desc">Newest First</MenuItem>
                <MenuItem value="date-asc">Oldest First</MenuItem>
                <MenuItem value="confidence-desc">Highest Confidence</MenuItem>
                <MenuItem value="confidence-asc">Lowest Confidence</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Paper>

      {/* Results */}
      {tests.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center", borderRadius: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
          <WaterDrop sx={{ fontSize: 64, color: alpha(theme.palette.primary.main, 0.3), mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            No test history found
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Make your first prediction on the Prediction page to see it here.
          </Typography>
        </Paper>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center", borderRadius: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
          <Search sx={{ fontSize: 64, color: alpha(theme.palette.primary.main, 0.3), mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            No results match your search
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Try adjusting your filters or search terms
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => { setQ(""); setFilterBy("all"); }}
            sx={{ borderRadius: 2 }}
          >
            Clear Filters
          </Button>
        </Paper>
      ) : (
        <>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, px: 1 }}>
            Showing {filtered.length} of {tests.length} tests
          </Typography>
          <Stack spacing={2}>
            {filtered.map((t) => {
              const confPct = typeof t.confidence === "number" ? Math.round(t.confidence * 100) : null;
              const isPotable = t.prediction === "Potable";

              return (
                <Paper 
                  key={t.id} 
                  sx={{ 
                    p: 2.5, 
                    borderRadius: 3,
                    border: `1px solid ${alpha(isPotable ? theme.palette.success.main : theme.palette.error.main, 0.2)}`,
                    background: `linear-gradient(135deg, ${alpha(isPotable ? theme.palette.success.main : theme.palette.error.main, 0.02)} 0%, white 100%)`,
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      boxShadow: theme.shadows[4]
                    }
                  }}
                >
                  <Stack spacing={2}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      spacing={2}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                          <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography sx={{ fontWeight: 700 }}>
                            {formatDate(t.createdAt)}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                          {t.barangay && (
                            <Chip 
                              label={t.barangay} 
                              size="small" 
                              variant="outlined"
                              sx={{ borderRadius: 1.5 }}
                            />
                          )}
                          {(t.issues || []).length > 0 && (
                            <Chip 
                              label={`${t.issues.length} issue${t.issues.length > 1 ? 's' : ''}`}
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ borderRadius: 1.5 }}
                            />
                          )}
                        </Stack>
                      </Box>

                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Chip
                          icon={<WaterDrop />}
                          label={t.prediction || "—"}
                          color={isPotable ? "success" : "error"}
                          sx={{ 
                            fontWeight: 700,
                            px: 1,
                            borderRadius: 2,
                          }}
                        />
                        {confPct !== null && (
                          <Chip 
                            icon={<TrendingUp />}
                            label={`${confPct}%`} 
                            variant="outlined"
                            sx={{ 
                              fontWeight: 700,
                              borderRadius: 2,
                            }}
                          />
                        )}
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => setSelected(t)}
                          sx={{ borderRadius: 2 }}
                        >
                          Details
                        </Button>
                      </Stack>
                    </Stack>

                    {(t.issues || []).length > 0 && (
                      <Box>
                        <Divider sx={{ mb: 1.5 }} />
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Issues:
                          </Typography>
                          {t.issues.slice(0, 3).map((issue, idx) => (
                            <Chip 
                              key={idx} 
                              label={issue} 
                              size="small"
                              sx={{ 
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                color: 'warning.dark',
                                fontWeight: 500,
                                borderRadius: 1
                              }}
                            />
                          ))}
                          {t.issues.length > 3 && (
                            <Chip 
                              label={`+${t.issues.length - 3} more`}
                              size="small"
                              sx={{ 
                                bgcolor: alpha(theme.palette.grey[500], 0.1),
                                fontWeight: 500,
                                borderRadius: 1
                              }}
                            />
                          )}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog 
        open={!!selected} 
        onClose={() => setSelected(null)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Test Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: 'grey.50' }}>
          {!selected ? null : (
            <Stack spacing={3}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Date & Time
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatDate(selected.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Barangay
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selected.barangay || "Not specified"}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                  Prediction Result
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                  <Chip
                    icon={<WaterDrop />}
                    label={selected.prediction}
                    color={selected.prediction === "Potable" ? "success" : "error"}
                    sx={{ fontWeight: 700, px: 2, py: 2.5, fontSize: '1rem' }}
                  />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Confidence Level
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {typeof selected.confidence === "number"
                        ? `${Math.round(selected.confidence * 100)}%`
                        : "—"}
                    </Typography>
                  </Box>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Prob. Potable
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {typeof selected.prob_potable === 'number' 
                        ? selected.prob_potable.toFixed(3) 
                        : '—'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Prob. Not Potable
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {typeof selected.prob_not_potable === 'number'
                        ? selected.prob_not_potable.toFixed(3)
                        : '—'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                  Detected Issues
                </Typography>
                {(selected.issues || []).length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    {selected.issues.map((issue, idx) => (
                      <Chip 
                        key={idx} 
                        label={issue} 
                        color="warning"
                        sx={{ fontWeight: 500 }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    No issues detected
                  </Typography>
                )}
              </Paper>

              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                  Water Quality Parameters
                </Typography>
                {selected.inputs ? (
                  <Grid container spacing={2}>
                    {[
                      { label: 'pH', key: 'ph' },
                      { label: 'Hardness', key: 'hardness' },
                      { label: 'Solids', key: 'solids' },
                      { label: 'Chloramines', key: 'chloramines' },
                      { label: 'Sulfate', key: 'sulfate' },
                      { label: 'Conductivity', key: 'conductivity' },
                      { label: 'Organic Carbon', key: 'organic_carbon' },
                      { label: 'Trihalomethanes', key: 'trihalomethanes' },
                      { label: 'Turbidity', key: 'turbidity' },
                    ].map(({ label, key }) => (
                      <Grid item xs={6} sm={4} key={key}>
                        <Box sx={{ p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {label}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                            {formatInputValue(selected.inputs[key])}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    No input data available
                  </Typography>
                )}
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelected(null)} variant="contained" sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}