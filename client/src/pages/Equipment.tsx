import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const Equipment: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          ציוד חירום
        </Typography>
        <Typography variant="body1">
          כאן תוכל לנהל את ציוד החירום שלך
        </Typography>
      </Paper>
    </Box>
  );
};

export default Equipment; 