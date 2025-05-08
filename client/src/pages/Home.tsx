import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button
} from '@mui/material';
import {
  Chat as ChatIcon,
  LocationOn as LocationIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const isRTL = language === 'he';

  const features = [
    {
      title: 'צ\'אט חירום',
      description: 'שאל שאלות וקבל מידע מיידי על מצבי חירום',
      icon: <ChatIcon sx={{ fontSize: 32, color: '#6C5DD3' }} />,
      path: '/chat'
    },
    {
      title: 'מקלטים',
      description: 'מצא את המקלט הקרוב אליך וקבל הוראות הגעה',
      icon: <LocationIcon sx={{ fontSize: 32, color: '#6C5DD3' }} />,
      path: '/shelters'
    },
    {
      title: 'ציוד חירום',
      description: 'נהל את רשימות הציוד שלך וקבל התראות על פריטים שעומדים לפוג',
      icon: <InventoryIcon sx={{ fontSize: 32, color: '#6C5DD3' }} />,
      path: '/equipment'
    }
  ];

  return (
    <Box sx={{ 
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      bgcolor: isDarkMode ? '#1F1D2B' : '#F6F8FA',
      margin: 0,
      padding: 0,
      py: 0
    }}>
      {/* Welcome Section */}
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          pt: 4,
          pb: 8,
          bgcolor: isDarkMode ? '#1F1D2B' : '#F6F8FA'
        }}
      >
        <Box 
          component="img"
          src="/support-agent.png"
          alt="Support Agent"
          sx={{
            width: 160,
            height: 160,
            mb: 3
          }}
        />
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            mb: 1,
            fontWeight: 700,
            fontSize: '2.25rem',
            background: 'linear-gradient(45deg, #6C5DD3, #7FBA7A)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 1px rgba(255, 255, 255, 0.2)',
            fontFamily: 'Heebo, Roboto, sans-serif',
            letterSpacing: '0.5px',
            '& > span': {
              mx: 0.5,
              background: 'inherit',
              WebkitBackgroundClip: 'inherit',
              backgroundClip: 'inherit',
              WebkitTextFillColor: 'inherit'
            }
          }}
        >
          <span>שלום</span>,<span>{user?.user_metadata?.first_name || 'משתמש'}</span>
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#7A7D9C',
            fontSize: '1.375rem',
            fontWeight: 400
          }}
        >
          מה תרצה לעשות היום?
        </Typography>
      </Box>

      {/* Features Grid */}
      <Grid 
        container 
        spacing={4} 
        sx={{ 
          width: '100%',
          m: 0,
          p: 0
        }}
      >
        {features.map((feature) => (
          <Grid item xs={12} md={4} key={feature.title}>
            <Card
              sx={{
                height: '100%',
                minHeight: '240px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '24px',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                bgcolor: isDarkMode ? '#28243D' : '#fff',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: isDarkMode 
                    ? '0px 8px 30px rgba(0, 0, 0, 0.3)'
                    : '0px 8px 30px rgba(108, 93, 211, 0.15)',
                  '& .icon-container': {
                    bgcolor: '#6C5DD3',
                    '& svg': {
                      color: '#fff'
                    }
                  },
                  '& .start-button': {
                    bgcolor: '#5B4CB3'
                  }
                }
              }}
            >
              <CardContent sx={{ 
                flexGrow: 1, 
                textAlign: 'center', 
                p: 3
              }}>
                <Box 
                  className="icon-container"
                  sx={{ 
                    mb: 2.5,
                    width: 64,
                    height: 64,
                    borderRadius: '20px',
                    bgcolor: 'rgba(108, 93, 211, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography 
                  variant="h5" 
                  component="h2"
                  sx={{ 
                    mb: 1.5,
                    fontSize: '1.25rem',
                    fontWeight: 500,
                    color: isDarkMode ? '#fff' : '#1F1D2B'
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography 
                  sx={{ 
                    fontSize: '0.9375rem',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#7A7D9C',
                    lineHeight: 1.6
                  }}
                >
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button
                  className="start-button"
                  variant="contained"
                  onClick={() => navigate(feature.path)}
                  sx={{ 
                    px: 4,
                    py: 1.25,
                    bgcolor: '#6C5DD3',
                    borderRadius: '14px',
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 500,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      bgcolor: '#5B4CB3',
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  התחל
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Home; 