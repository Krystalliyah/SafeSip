import React from "react";
import { 
  Box, 
  List, 
  ListItem, 
  ListItemIcon,
  ListItemText, 
  Divider,
  Typography,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  Dashboard,
  Science,
  History,
  Analytics,
  Settings,
  WaterDrop,
  InfoOutlined,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { text: "Prediction", icon: <Science />, path: "/" },
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
    { text: "Test History", icon: <History />, path: "/history" },
    { text: "Analytics", icon: <Analytics />, path: "/analytics" },
    { text: "Settings", icon: <Settings />, path: "/settings" },
  ];

  return (
    <Box sx={{ 
      width: 280, 
      bgcolor: 'white', 
      color: 'text.primary',
      height: "100vh",
      position: "fixed",
      borderRight: '1px solid',
      borderColor: 'grey.200',
      display: { xs: 'none', md: 'block' },
      zIndex: 1,
    }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <WaterDrop sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
              SafeSip
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              SDG 6 Initiative
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Divider sx={{ mx: 2 }} />
      
      <List sx={{ mt: 2, px: 2 }}>
        {menuItems.map((item, index) => (
          <ListItem 
            button 
            key={index}
            component={Link}
            to={item.path}
            sx={{
              borderRadius: 2,
              mb: 1,
              '&:hover': {
                bgcolor: 'primary.50',
                color: 'primary.main',
              },
              ...(location.pathname === item.path || 
                  (item.path === "/" && location.pathname === "/") ? {
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              } : {}),
            }}
          >
            <ListItemIcon sx={{ 
              color: 'inherit',
              minWidth: 40,
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              primaryTypographyProps={{
                fontWeight: 500,
                fontSize: '0.95rem',
              }}
            />
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ position: 'absolute', bottom: 0, p: 3, width: '100%' }}>
        <Box sx={{ 
          bgcolor: 'primary.50', 
          p: 2, 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'primary.100',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <InfoOutlined sx={{ fontSize: 16, color: 'primary.main', mt: 0.25, mr: 1 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>
              <strong>Model Disclaimer:</strong> Predictions based on trained AI model
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            <Tooltip title="62% overall accuracy" arrow>
              <Chip 
                label="Accuracy: 62%" 
                size="small" 
                sx={{ 
                  fontSize: '10px',
                  height: 20,
                  bgcolor: 'primary.100',
                  color: 'primary.dark'
                }} 
              />
            </Tooltip>
            
            <Tooltip title="Potable water precision" arrow>
              <Chip 
                label="Potable: 68%" 
                size="small" 
                sx={{ 
                  fontSize: '10px',
                  height: 20,
                  bgcolor: 'success.100',
                  color: 'success.dark'
                }} 
              />
            </Tooltip>
            
            <Tooltip title="Non-potable water precision" arrow>
              <Chip 
                label="Not Potable: 51%" 
                size="small" 
                sx={{ 
                  fontSize: '10px',
                  height: 20,
                  bgcolor: 'warning.100',
                  color: 'warning.dark'
                }} 
              />
            </Tooltip>
          </Box>
          
          <Typography variant="caption" sx={{ 
            color: 'text.secondary', 
            fontStyle: 'italic',
            display: 'block',
            fontSize: '9px',
            lineHeight: 1.2
          }}>
            Trained on water quality dataset with 656 test samples
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;