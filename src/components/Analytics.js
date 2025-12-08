import React from "react";
import { Box, Typography, Paper, Button } from "@mui/material";
import { Analytics as AnalyticsIcon } from "@mui/icons-material";

const Analytics = () => {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <AnalyticsIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
      <Typography variant="h4" sx={{ mb: 2, color: 'primary.main' }}>
        Analytics Dashboard
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
        This section would contain detailed analytics, charts, and trends about water quality data.
        Features coming soon!
      </Typography>
      <Button variant="contained" size="large">
        Explore Sample Analytics
      </Button>
    </Box>
  );
};

export default Analytics;