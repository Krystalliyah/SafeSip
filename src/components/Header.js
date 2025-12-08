import React from "react";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton,
  Badge,
  Avatar,
  Chip,
} from "@mui/material";
import {
  Notifications,
  Science,
  WaterDrop
} from "@mui/icons-material";

const Header = () => {
  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        bgcolor: 'white', 
        color: 'primary.main',
        boxShadow: '0 2px 10px rgba(0, 102, 204, 0.1)',
        borderBottom: '1px solid',
        borderColor: 'grey.200',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <WaterDrop sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
              SafeSip
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
              Water Potability Prediction System
            </Typography>
          </Box>
          
          <Chip 
            icon={<Science sx={{ fontSize: 16 }} />}
            label="ML Powered"
            size="small"
            sx={{ 
              ml: 2, 
              bgcolor: 'primary.50', 
              color: 'primary.main',
              fontWeight: 500,
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton sx={{ color: 'text.secondary' }}>
            <Badge badgeContent={2} color="error" size="small">
              <Notifications />
            </Badge>
          </IconButton>
          
          <Avatar 
            sx={{ 
              bgcolor: 'primary.main',
              width: 36,
              height: 36,
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            U
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;