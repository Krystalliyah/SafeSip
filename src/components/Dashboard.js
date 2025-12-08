import React, { useState } from "react";
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  List, 
  ListItem, 
  ListItemText,
  Button,
  Chip,
  IconButton
} from "@mui/material";
import { 
  WaterDrop, 
  Warning, 
  CheckCircle,
  TrendingUp,
  Analytics,
  History,
  Refresh,
  ArrowForward
} from "@mui/icons-material";

const Dashboard = () => {
  const [metrics] = useState([
    { 
      title: "Tests Today", 
      value: "156", 
      icon: <WaterDrop sx={{ fontSize: 40, color: "#0066cc" }} />,
      change: "+12%",
      color: "#e6f7ff",
      description: "Water samples analyzed"
    },
    { 
      title: "Safe Sources", 
      value: "89%", 
      icon: <CheckCircle sx={{ fontSize: 40, color: "#00a86b" }} />,
      change: "+3%",
      color: "#e8f5e9",
      description: "Passed potability standards"
    },
    { 
      title: "Issues Detected", 
      value: "23", 
      icon: <Warning sx={{ fontSize: 40, color: "#ff9800" }} />,
      change: "-5%",
      color: "#fff3e0",
      description: "Require attention"
    },
    { 
      title: "Avg. Confidence", 
      value: "87%", 
      icon: <TrendingUp sx={{ fontSize: 40, color: "#9c27b0" }} />,
      change: "+2%",
      color: "#f3e5f5",
      description: "ML prediction accuracy"
    }
  ]);

  const [recentTests] = useState([
    { 
      location: "Downtown Community Well", 
      status: "safe", 
      ph: 7.2, 
      time: "2 min ago",
      confidence: "92%",
      user: "Health Dept"
    },
    { 
      location: "Industrial Zone River", 
      status: "unsafe", 
      ph: 5.8, 
      time: "15 min ago",
      confidence: "88%",
      user: "Field Agent"
    },
    { 
      location: "Residential Area Tap", 
      status: "safe", 
      ph: 6.9, 
      time: "30 min ago",
      confidence: "94%",
      user: "Community Volunteer"
    },
    { 
      location: "Mountain Spring", 
      status: "warning", 
      ph: 6.2, 
      time: "1 hour ago",
      confidence: "76%",
      user: "Research Team"
    }
  ]);

  const [commonIssues] = useState([
    { issue: "High Turbidity", percentage: 45, count: 104 },
    { issue: "Low pH Levels", percentage: 30, count: 69 },
    { issue: "High Chloramines", percentage: 15, count: 35 },
    { issue: "Excess Solids", percentage: 10, count: 23 }
  ]);

  const handleCardClick = (title) => {
    alert(`Clicked: ${title}. This would navigate to detailed view.`);
    // In real app: navigate(`/details/${title.toLowerCase()}`);
  };

  const handleTestClick = (test) => {
    alert(`Test Details:\nLocation: ${test.location}\nStatus: ${test.status}\npH: ${test.ph}\nConfidence: ${test.confidence}`);
  };

  const handleRefresh = () => {
    alert("Refreshing dashboard data...");
    // In real app: fetchLatestData();
  };

  const handleViewAll = () => {
    alert("Navigating to full test history...");
    // In real app: navigate('/history');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: "#0066cc" }}>
          Water Safety Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          sx={{ borderRadius: 2 }}
        >
          Refresh Data
        </Button>
      </Box>
      
      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 3,
                backgroundColor: metric.color,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0, 102, 204, 0.15)',
                }
              }}
              onClick={() => handleCardClick(metric.title)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {metric.icon}
                <Box sx={{ ml: 2, flexGrow: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {metric.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1 }}>
                    {metric.value}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: metric.change.startsWith('+') ? '#00a86b' : '#f44336',
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}
                >
                  {metric.change} from yesterday
                </Typography>
                <ArrowForward sx={{ fontSize: 16, color: '#666' }} />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {metric.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Left Column - Recent Tests */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <History sx={{ mr: 1 }} /> Recent Water Tests
              </Typography>
              <Button 
                size="small" 
                endIcon={<ArrowForward />}
                onClick={handleViewAll}
              >
                View All
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              {recentTests.map((test, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      borderLeft: 4, 
                      borderColor: test.status === "safe" ? "#00a86b" : 
                                   test.status === "warning" ? "#ff9800" : "#f44336",
                      backgroundColor: test.status === "safe" ? "#f1f8e9" : 
                                      test.status === "warning" ? "#fff3e0" : "#ffebee",
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateX(5px)',
                        boxShadow: 2
                      }
                    }}
                    onClick={() => handleTestClick(test)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>
                          {test.location}
                        </Typography>
                        <Chip 
                          label={test.status.toUpperCase()}
                          size="small"
                          color={test.status === "safe" ? "success" : 
                                 test.status === "warning" ? "warning" : "error"}
                          sx={{ mb: 1 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {test.time}
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          pH: <strong>{test.ph}</strong>
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Confidence: <strong>{test.confidence}</strong>
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Tested by: {test.user}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Right Column - Analytics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
              <Analytics sx={{ mr: 1 }} /> Quality Analytics
            </Typography>
            
            {/* Safe vs Unsafe Chart */}
            <Paper sx={{ p: 2, mb: 3, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Safe vs Unsafe Tests
              </Typography>
              <Box sx={{ position: 'relative', height: 120, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {/* Pie Chart Visualization */}
                <Box sx={{ 
                  width: 100, 
                  height: 100, 
                  borderRadius: '50%',
                  background: `conic-gradient(#00a86b 0% 75%, #f44336 75% 100%)`,
                  position: 'relative'
                }}>
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="h6" fontWeight="bold">
                      75%
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: '#00a86b', mr: 1, borderRadius: '50%' }} />
                  <Typography variant="caption">Safe (117)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: '#f44336', mr: 1, borderRadius: '50%' }} />
                  <Typography variant="caption">Unsafe (39)</Typography>
                </Box>
              </Box>
            </Paper>
            
            {/* Common Issues */}
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Most Common Issues
              </Typography>
              <List dense>
                {commonIssues.map((issue, index) => (
                  <ListItem 
                    key={index}
                    sx={{ 
                      px: 0,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                      cursor: 'pointer'
                    }}
                    onClick={() => alert(`Details for: ${issue.issue}`)}
                  >
                    <ListItemText 
                      primary={issue.issue}
                      secondary={`${issue.count} cases • ${issue.percentage}%`}
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                    <Box sx={{ 
                      width: 60, 
                      height: 8, 
                      bgcolor: '#e0e0e0',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ 
                        width: `${issue.percentage}%`, 
                        height: '100%', 
                        bgcolor: index === 0 ? '#f44336' : 
                                 index === 1 ? '#ff9800' : 
                                 index === 2 ? '#ffc107' : '#9c27b0'
                      }} />
                    </Box>
                  </ListItem>
                ))}
              </List>
              <Button 
                fullWidth 
                size="small" 
                sx={{ mt: 2 }}
                onClick={() => alert("Viewing detailed analytics...")}
              >
                View Detailed Report
              </Button>
            </Paper>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions Footer */}
      <Paper sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: '#e6f7ff' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Button 
              fullWidth 
              variant="contained" 
              startIcon={<WaterDrop />}
              sx={{ borderRadius: 2 }}
              onClick={() => alert("Starting new test...")}
            >
              New Test
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<History />}
              sx={{ borderRadius: 2 }}
              onClick={() => alert("Viewing history...")}
            >
              View History
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<Analytics />}
              sx={{ borderRadius: 2 }}
              onClick={() => alert("Generating report...")}
            >
              Generate Report
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<Warning />}
              sx={{ borderRadius: 2 }}
              onClick={() => alert("Viewing alerts...")}
            >
              View Alerts
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard;