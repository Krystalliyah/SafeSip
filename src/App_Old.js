import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box, CssBaseline, Container, Typography } from "@mui/material";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Sidebar from "./components/sidebar";
import Header from "./components/Header";
import PredictionForm from "./components/PredictionForm";
import ResultDisplay from "./components/ResultDisplay";
import Dashboard from "./components/Dashboard";
import TestHistory from "./components/TestHistory";
import Analytics from "./components/Analytics";
import Settings from "./components/Settings";
import { useAuth } from "./components/AuthContext";  
import "./App.css";

const theme = createTheme({
  palette: {
    primary: {
      main: '#0066cc',
      light: '#4d94ff',
      dark: '#004999',
    },
    secondary: {
      main: '#00a86b',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
    background: {
      default: '#f0f9ff',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontWeight: 600, fontSize: '2rem' },
    h3: { fontWeight: 600, fontSize: '1.75rem' },
    h4: { fontWeight: 600, fontSize: '1.5rem' },
    h5: { fontWeight: 500, fontSize: '1.25rem' },
    h6: { fontWeight: 500, fontSize: '1rem' },
    body1: { fontWeight: 400, fontSize: '1rem' },
    body2: { fontWeight: 400, fontSize: '0.875rem' },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: '10px 24px', fontWeight: 600 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': { borderRadius: 8 },
        },
      },
    },
  },
});

const App = () => {
  const [predictionResult, setPredictionResult] = useState(null);
  const { currentUser, authLoading } = useAuth();

  const handlePrediction = (result) => {
    setPredictionResult(result);
  };

  // Main Prediction Page Component
  const PredictionPage = () => (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', lg: 'row' }, 
        gap: 4,
        alignItems: 'flex-start'
      }}>
        <Box sx={{ flex: 1, width: '100%' }}>
          <Box sx={{ 
            bgcolor: 'white', 
            borderRadius: 3,
            p: 3,
            mb: 4,
            boxShadow: '0 4px 20px rgba(0, 102, 204, 0.1)',
            border: '1px solid',
            borderColor: 'primary.light',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                width: 50, 
                height: 50, 
                bgcolor: 'primary.main', 
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.5rem' }}>6</span>
              </Box>
              <Box>
                <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  SDG 6: Clean Water & Sanitation
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Ensuring access to safe and affordable drinking water
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="body1" sx={{ mb: 2, color: 'text.primary' }}>
              SafeSip uses machine learning to predict water potability based on 9 key parameters. 
              This tool helps communities quickly assess water safety and prioritize laboratory testing.
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1, 
              mt: 2 
            }}>
              {['ph', 'Hardness', 'Solids', 'Chloramines', 'Sulfate', 'Conductivity', 'Organic Carbon', 'Trihalomethanes', 'Turbidity'].map((param) => (
                <Box key={param} sx={{
                  bgcolor: 'primary.50',
                  color: 'primary.main',
                  px: 2,
                  py: 1,
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}>
                  {param}
                </Box>
              ))}
            </Box>
          </Box>
          
          <PredictionForm onPredict={handlePrediction} />
        </Box>
        
        <Box sx={{ 
          flex: 1, 
          width: '100%',
          position: { lg: 'sticky' },
          top: 20,
        }}>
          <ResultDisplay result={predictionResult} />
        </Box>
      </Box>
    </Container>
  );

  if (authLoading) {
    // Optional: nicer loading state
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1">Checking authentication...</Typography>
      </Box>
    );
  }

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <Box sx={{ display: "flex" }}>
          <CssBaseline />

          {/* ⬇️ Only show Sidebar when logged in */}
          {currentUser && <Sidebar />}

          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              ml: currentUser ? { xs: 0, md: '280px' } : 0,
              minHeight: '100vh',
              bgcolor: 'background.default',
              position: 'relative',
            }}
          >
            {/* Header always shown, but on landing we force auth dialog open */}
            <Header forceAuthOnStart={!currentUser} />

            {currentUser ? (
              // ✅ Logged-in routes
              <Routes>
                <Route path="/" element={<PredictionPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/history" element={<TestHistory />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            ) : (
              // 🚪 Landing "please log in" screen (no routes, no app content)
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 64px)', // minus header height
                px: 2,
                textAlign: 'center',
              }}>
                <Typography variant="h4" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  Welcome to SafeSip
                </Typography>
                <Typography variant="body1" sx={{ maxWidth: 500, color: 'text.secondary' }}>
                  Please log in or create an account to use the water potability prediction tools.
                  The login window should be open above. If it is closed, click the avatar in the header.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </ThemeProvider>
    </Router>
  );
};

export default App;