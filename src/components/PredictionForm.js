import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Slider,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Science,
  Calculate,
  Info,
  Refresh,
  Upload,
} from '@mui/icons-material';
import { mockPredict } from './mockPredictor';

const PredictionForm = ({ onPredict }) => {
  const [waterData, setWaterData] = useState({
    ph: 7.0,
    hardness: 150,
    solids: 20000,
    chloramines: 7.0,
    sulfate: 250,
    conductivity: 400,
    organic_carbon: 12.0,
    trihalomethanes: 80,
    turbidity: 4.0,
  });

  const [loading, setLoading] = useState(false);

  const parameterInfo = {
    ph: { min: 0, max: 14, step: 0.1, unit: 'pH', ideal: '6.5-8.5' },
    hardness: { min: 0, max: 400, step: 1, unit: 'mg/L', ideal: '50-150' },
    solids: { min: 0, max: 50000, step: 100, unit: 'mg/L', ideal: '<500' },
    chloramines: { min: 0, max: 20, step: 0.1, unit: 'mg/L', ideal: '<4' },
    sulfate: { min: 0, max: 500, step: 1, unit: 'mg/L', ideal: '<250' },
    conductivity: { min: 0, max: 1000, step: 1, unit: 'μS/cm', ideal: '200-800' },
    organic_carbon: { min: 0, max: 30, step: 0.1, unit: 'mg/L', ideal: '<10' },
    trihalomethanes: { min: 0, max: 200, step: 1, unit: 'μg/L', ideal: '<80' },
    turbidity: { min: 0, max: 10, step: 0.1, unit: 'NTU', ideal: '<5' },
  };

  const handleChange = (param) => (event) => {
    const value = parseFloat(event.target.value);
    setWaterData({ ...waterData, [param]: value });
  };

  const handleSliderChange = (param) => (event, newValue) => {
    setWaterData({ ...waterData, [param]: newValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Using mock predictor for now - replace with real API later
      const result = await mockPredict(waterData);
      onPredict(result);
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    setWaterData({
      ph: 7.0,
      hardness: 150,
      solids: 20000,
      chloramines: 7.0,
      sulfate: 250,
      conductivity: 400,
      organic_carbon: 12.0,
      trihalomethanes: 80,
      turbidity: 4.0,
    });
  };

  return (
    <Paper sx={{ 
      p: 3, 
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      bgcolor: 'white',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Science sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Water Quality Parameters
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter 9 water quality parameters for potability prediction
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {Object.entries(waterData).map(([param, value]) => (
            <Grid item xs={12} sm={6} md={4} key={param}>
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {param.replace('_', ' ')}
                  </Typography>
                  <Tooltip title={`Ideal range: ${parameterInfo[param]?.ideal || 'N/A'} ${parameterInfo[param]?.unit || ''}`}>
                    <IconButton size="small" sx={{ ml: 0.5 }}>
                      <Info fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <TextField
                  fullWidth
                  type="number"
                  value={value}
                  onChange={handleChange(param)}
                  inputProps={{
                    min: parameterInfo[param]?.min || 0,
                    max: parameterInfo[param]?.max || 100,
                    step: parameterInfo[param]?.step || 1,
                  }}
                  sx={{ mb: 2 }}
                  size="small"
                />
                
                <Slider
                  value={value}
                  onChange={handleSliderChange(param)}
                  min={parameterInfo[param]?.min || 0}
                  max={parameterInfo[param]?.max || 100}
                  step={parameterInfo[param]?.step || 1}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${v} ${parameterInfo[param]?.unit || ''}`}
                  sx={{
                    color: 'primary.main',
                    '& .MuiSlider-thumb': {
                      width: 16,
                      height: 16,
                    },
                  }}
                />
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {parameterInfo[param]?.unit || ''} • Ideal: {parameterInfo[param]?.ideal || 'N/A'}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={resetToDefault}
              sx={{ borderRadius: 2 }}
            >
              Reset
            </Button>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              sx={{ borderRadius: 2 }}
            >
              Import CSV
            </Button>
          </Box>
          
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Calculate />}
            disabled={loading}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              fontSize: '1rem',
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(0, 102, 204, 0.3)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {loading ? 'Predicting...' : 'Predict Potability'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default PredictionForm;