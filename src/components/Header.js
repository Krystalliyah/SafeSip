// src/components/Header.js
import React, { useState, useEffect } from "react";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton,
  Badge,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Button,
} from "@mui/material";
import {
  Notifications,
  Science,
  WaterDrop,
  Logout as LogoutIcon,
  AccountCircle,
} from "@mui/icons-material";

import { useAuth } from "./AuthContext";   
import AuthDialog from "./AuthDialog";     

const Header = ({ forceAuthOnStart = false }) => {
  const { currentUser, logout } = useAuth();

  const [authOpen, setAuthOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const menuOpen = Boolean(menuAnchor);

  // ⬇️ Auto-open login/register dialog on first load if not logged in
  useEffect(() => {
    if (forceAuthOnStart && !currentUser) {
      setAuthOpen(true);
    }
  }, [forceAuthOnStart, currentUser]);

  const handleAvatarClick = (event) => {
    if (!currentUser) {
      setAuthOpen(true);
    } else {
      setMenuAnchor(event.currentTarget);
    }
  };

  const handleCloseDialog = () => {
    setAuthOpen(false);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setMenuAnchor(null);
    }
  };

  const initial = currentUser?.email
    ? currentUser.email.charAt(0).toUpperCase()
    : "U";

  return (
    <>
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
          {/* Left side */}
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
          
          {/* Right side */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!currentUser && (
              <Button
                onClick={handleAvatarClick}
                variant="contained"
                >
                Sign In
              </Button>
            )}
            {currentUser && (
              <>
              <IconButton sx={{ color: 'text.secondary' }}>
              </IconButton>
              <Avatar 
                sx={{ 
                  bgcolor: 'primary.main',
                  width: 36,
                  height: 36,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={handleAvatarClick}
              >
                {initial}
              </Avatar>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Login/Register dialog */}
      <AuthDialog open={authOpen} onClose={handleCloseDialog} />

      {/* Avatar menu when logged in */}
      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem disabled>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          {currentUser?.email || "Signed in"}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default Header;
