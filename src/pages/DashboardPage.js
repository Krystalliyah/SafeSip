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
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha,
} from "@mui/material";
import {
  WaterDrop,
  Warning,
  CheckCircle,
  TrendingUp,
  Assessment,
} from "@mui/icons-material";

import { useAuth } from "../components/AuthContext";
import { subscribeToRecentTests } from "../services/testsService";
import { deriveIssues } from "../utils/issues";

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [tests, setTests] = useState([]);
  const theme = useTheme();

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

    // Recent trend (last 10 vs previous 10)
    const recent10 = tests.slice(0, 10);
    const prev10 = tests.slice(10, 20);
    const recentSafe = recent10.filter(t => t.prediction === "Potable").length;
    const prevSafe = prev10.filter(t => t.prediction === "Potable").length;
    const trend = prev10.length > 0 ? recentSafe - prevSafe : 0;

    return { total, potable, notPotable, safeRate, avgConf, commonIssues, trend };
  }, [tests]);

  const StatCard = ({ icon, label, value, subtitle, color = "primary", progress }) => (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        }
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: 'primary.main' }}>
          Water Quality Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Real-time insights from {stats.total} water quality tests
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Assessment sx={{ fontSize: 28 }} />}
            label="Total Tests"
            value={stats.total}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CheckCircle sx={{ fontSize: 28 }} />}
            label="Safe Water"
            value={stats.potable}
            subtitle={`${stats.safeRate}% potable rate`}
            color="success"
            progress={stats.safeRate}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Warning sx={{ fontSize: 28 }} />}
            label="Unsafe Water"
            value={stats.notPotable}
            subtitle={`${100 - stats.safeRate}% non-potable`}
            color="error"
            progress={100 - stats.safeRate}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TrendingUp sx={{ fontSize: 28 }} />}
            label="Avg Confidence"
            value={`${stats.avgConf}%`}
            subtitle="Model certainty"
            color="info"
            progress={stats.avgConf}
          />
        </Grid>
      </Grid>

      {stats.trend !== 0 && (
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 3,
            background: stats.trend > 0 
              ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(stats.trend > 0 ? theme.palette.success.main : theme.palette.warning.main, 0.2)}`
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <TrendingUp 
              sx={{ 
                fontSize: 32, 
                color: stats.trend > 0 ? 'success.main' : 'warning.main',
                transform: stats.trend < 0 ? 'rotate(180deg)' : 'none'
              }} 
            />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {stats.trend > 0 ? 'Improvement Detected' : 'Quality Decline Noted'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {Math.abs(stats.trend)} {stats.trend > 0 ? 'more' : 'fewer'} safe tests in last 10 compared to previous 10
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      <Paper 
        sx={{ 
          p: 3, 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, white 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" mb={3}>
          <WaterDrop sx={{ fontSize: 28, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Common Water Quality Issues
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Top issues detected across all tests
            </Typography>
          </Box>
        </Stack>
        
        <Divider sx={{ mb: 3 }} />

        {stats.commonIssues.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
              No issues detected yet
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Run more tests to identify water quality patterns
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2.5}>
            {stats.commonIssues.map((iss, idx) => (
              <Paper
                key={iss.name}
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
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
                      {iss.name}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {iss.count} occurrences
                    </Typography>
                    <Chip 
                      label={`${iss.pct}%`} 
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ fontWeight: 700, minWidth: 60 }}
                    />
                  </Stack>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={iss.pct} 
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
            ))}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}