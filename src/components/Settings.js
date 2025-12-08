import React from "react";
import { Box, Typography, Paper, Button } from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";

const Settings = () => {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <SettingsIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
      <Typography variant="h4" sx={{ mb: 2, color: 'primary.main' }}>
        Settings
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
        Configure your SafeSip preferences, notification settings, and account details here.
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 400, mx: 'auto', textAlign: 'left' }}>
        <Typography variant="h6" gutterBottom>Quick Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          • Email notifications
          <br />
          • Data export preferences
          <br />
          • Measurement units
          <br />
          • Privacy settings
        </Typography>
      </Paper>
    </Box>
  );
};

export default Settings;