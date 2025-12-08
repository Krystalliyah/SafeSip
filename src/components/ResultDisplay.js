import React from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
} from '@mui/material';
import {
  CheckCircle,
  Dangerous,
  TrendingUp,
  WaterDrop,
  Science,
  Download,
  Share,
} from '@mui/icons-material';

const ResultsDisplay = ({ result }) => {
  if (!result) {
    return (
      <Paper sx={{ 
        p: 4, 
        borderRadius: 3,
        textAlign: 'center',
        bgcolor: 'white',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <WaterDrop sx={{ fontSize: 64, color: 'primary.light', mb: 2, opacity: 0.7 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
          No Prediction Yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
          Enter water quality parameters and click "Predict Potability" to see results
        </Typography>
      </Paper>
    );
  }

  const { potable, confidence, message, details, score } = result;
  const confidencePercent = Math.round(confidence * 100);

  return (
    <Paper sx={{ 
      p: 4, 
      borderRadius: 3,
      bgcolor: 'white',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      height: '100%',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        {potable ? (
          <CheckCircle sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
        ) : (
          <Dangerous sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
        )}
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: potable ? 'secondary.main' : 'error.main' }}>
            {message}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Machine Learning Prediction Result
          </Typography>
        </Box>
      </Box>

      {/* Confidence Meter */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Confidence Level
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {confidencePercent}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={confidencePercent} 
          sx={{ 
            height: 12, 
            borderRadius: 6,
            bgcolor: potable ? 'secondary.50' : 'error.50',
            '& .MuiLinearProgress-bar': {
              bgcolor: potable ? 'secondary.main' : 'error.main',
              borderRadius: 6,
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {confidencePercent >= 80 ? 'High confidence prediction' : 
           confidencePercent >= 60 ? 'Moderate confidence prediction' : 
           'Low confidence prediction - consider laboratory testing'}
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Details */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Analysis Details
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        {details}
      </Typography>

      {/* Water Safety Score */}
      {score && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            Safety Score: {score}/100
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {[...Array(10)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  height: 8,
                  bgcolor: i < score / 10 ? 
                    (potable ? 'secondary.main' : 'error.main') : 
                    'grey.200',
                  borderRadius: 4,
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Recommendations */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'primary.50', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
          <Science sx={{ mr: 1 }} /> Recommendations
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <TrendingUp fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary={potable ? 
                "This water source appears safe for drinking" : 
                "Further laboratory testing recommended"}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WaterDrop fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary={potable ? 
                "Monitor parameters monthly for consistency" : 
                "Consider water treatment before consumption"}
            />
          </ListItem>
        </List>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<Download />}
          fullWidth
          sx={{ borderRadius: 2 }}
        >
          Download Report
        </Button>
        <Button
          variant="contained"
          startIcon={<Share />}
          fullWidth
          sx={{ 
            borderRadius: 2,
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          Share Results
        </Button>
      </Box>

      {/* Model Info */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block', textAlign: 'center' }}>
        Powered by Random Forest Classifier • Trained on Water Potability Dataset
      </Typography>
    </Paper>
  );
};

export default ResultsDisplay;