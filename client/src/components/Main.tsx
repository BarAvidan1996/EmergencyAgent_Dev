import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Grid } from '@mui/material';
import { LocationOn, Chat, Storage } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

const Main = () => {
  const { t } = useLanguage();
  
  // TODO: Replace with actual user's first name from auth context
  const userName = "משתמש";

  const cards = [
    {
      icon: <Storage sx={{ fontSize: 64, color: '#6C5DD3' }} />,
      title: 'ציוד חירום',
      description: 'נהל את רשימות הציוד שלך וקבל התראות על פריטים שעומדים לפוג',
      buttonText: 'התחל',
      link: '/equipment'
    },
    {
      icon: <LocationOn sx={{ fontSize: 64, color: '#6C5DD3' }} />,
      title: 'מקלטים',
      description: 'מצא את המקלט הקרוב אליך וקבל הוראות הגעה',
      buttonText: 'התחל',
      link: '/shelters'
    },
    {
      icon: <Chat sx={{ fontSize: 64, color: '#6C5DD3' }} />,
      title: "צ'אט חירום",
      description: 'שאל שאלות וקבל מידע מיידי על מצבי חירום',
      buttonText: 'התחל',
      link: '/chat'
    }
  ];

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      p: 2 
    }}>
      {/* Welcome Section */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mb: 2,
      }}>
        {/* Logo Image */}
        <Box sx={{ 
          mb: 0,
          display: 'flex',
          alignItems: 'flex-end',
          '& img': {
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            marginBottom: '-10px'
          }
        }}>
          <img src="/support-agent.png" alt="עילם" style={{ width: '180px' }} />
        </Box>

        {/* Welcome Text */}
        <Box sx={{ textAlign: 'center', mt: 0 }}>
          <Typography variant="h3" component="h1" sx={{ 
            mb: 0.2,
            fontWeight: 700,
            fontSize: '2.8rem',
            background: 'linear-gradient(45deg, #6C5DD3, #7FBA7A)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.2,
          }}>
            {`שלום, ${userName}`}
          </Typography>
          <Typography variant="h5" sx={{ 
            color: 'text.secondary',
            fontSize: '1.6rem',
            lineHeight: 1.2,
          }}>
            מה תרצה לעשות היום?
          </Typography>
        </Box>
      </Box>

      {/* Cards Grid */}
      <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{
              height: '380px',
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
              },
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid rgba(0, 0, 0, 0.05)',
            }}>
              <CardContent sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                p: 4,
              }}>
                <Box sx={{
                  width: 100,
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(108, 93, 211, 0.1)',
                }}>
                  {card.icon}
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
                  <Typography variant="h5" component="h2" sx={{ 
                    fontWeight: 600,
                    fontSize: '1.5rem',
                  }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ 
                    fontSize: '1.1rem',
                    lineHeight: 1.6,
                  }}>
                    {card.description}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="large"
                  component={RouterLink}
                  to={card.link}
                  sx={{
                    width: '100%',
                    backgroundColor: '#6C5DD3',
                    '&:hover': {
                      backgroundColor: '#5B4CB3',
                    },
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 5,
                    py: 1.5,
                    fontSize: '1.2rem',
                  }}
                >
                  {card.buttonText}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Main; 