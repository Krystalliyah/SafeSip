// src/components/TestHistory.js
import React from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Search,
  FilterList,
  Download,
  Visibility,
} from "@mui/icons-material";

const TestHistory = () => {
  const testHistory = [
    { id: 1, date: "2024-01-15", location: "Downtown Well", ph: 7.2, status: "safe", confidence: "92%", user: "Health Dept" },
    { id: 2, date: "2024-01-14", location: "Industrial River", ph: 5.8, status: "unsafe", confidence: "88%", user: "Field Agent" },
    { id: 3, date: "2024-01-14", location: "Residential Tap", ph: 6.9, status: "safe", confidence: "94%", user: "Volunteer" },
    { id: 4, date: "2024-01-13", location: "Mountain Spring", ph: 6.2, status: "warning", confidence: "76%", user: "Research" },
    { id: 5, date: "2024-01-12", location: "Lake Source", ph: 7.8, status: "safe", confidence: "91%", user: "Health Dept" },
    { id: 6, date: "2024-01-12", location: "Factory Outlet", ph: 4.5, status: "unsafe", confidence: "95%", user: "Inspector" },
    { id: 7, date: "2024-01-11", location: "School Well", ph: 7.0, status: "safe", confidence: "89%", user: "Teacher" },
    { id: 8, date: "2024-01-11", location: "Farm Source", ph: 6.5, status: "safe", confidence: "85%", user: "Farmer" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "safe": return "success";
      case "warning": return "warning";
      case "unsafe": return "error";
      default: return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: "#0066cc" }}>
          Test History
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search tests..."
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
          <IconButton>
            <FilterList />
          </IconButton>
          <IconButton>
            <Download />
          </IconButton>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.50' }}>
            <TableRow>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Location</strong></TableCell>
              <TableCell><strong>pH Level</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Confidence</strong></TableCell>
              <TableCell><strong>Tested By</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {testHistory.map((test) => (
              <TableRow 
                key={test.id}
                sx={{ 
                  '&:hover': { bgcolor: 'rgba(0, 102, 204, 0.02)' },
                  cursor: 'pointer'
                }}
                onClick={() => alert(`Viewing details for test #${test.id}`)}
              >
                <TableCell>{test.date}</TableCell>
                <TableCell>
                  <Typography fontWeight="medium">{test.location}</Typography>
                </TableCell>
                <TableCell>{test.ph}</TableCell>
                <TableCell>
                  <Chip 
                    label={test.status.toUpperCase()}
                    color={getStatusColor(test.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography fontWeight="medium" color="primary.main">
                    {test.confidence}
                  </Typography>
                </TableCell>
                <TableCell>{test.user}</TableCell>
                <TableCell>
                  <IconButton 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Detailed view for: ${test.location}`);
                    }}
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {testHistory.length} of 156 total tests
        </Typography>
      </Box>
    </Box>
  );
};

export default TestHistory;