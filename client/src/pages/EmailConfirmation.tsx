import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

const EmailConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const isRTL = language === 'he';
  const email = location.state?.email;

  const handleResendEmail = async () => {
    if (!email) {
      console.error('No email found in location state');
      toast.error(
        isRTL ? 'לא נמצאה כתובת אימייל' : 'Email address not found',
        {
          position: isRTL ? toast.POSITION.TOP_RIGHT : toast.POSITION.TOP_LEFT,
          rtl: isRTL
        }
      );
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting to resend verification email to:', email);
      
      // Send a magic link email
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false
        }
      });

      if (error) {
        console.error('Magic link error:', error);
        throw error;
      }

      toast.success(
        isRTL ? 'מייל אימות נשלח בהצלחה' : 'Verification email sent successfully',
        {
          position: isRTL ? toast.POSITION.TOP_RIGHT : toast.POSITION.TOP_LEFT,
          rtl: isRTL
        }
      );
    } catch (error: any) {
      console.error('Error resending email:', error);
      toast.error(
        isRTL ? 'שגיאה בשליחת מייל האימות' : 'Error sending verification email',
        {
          position: isRTL ? toast.POSITION.TOP_RIGHT : toast.POSITION.TOP_LEFT,
          rtl: isRTL
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f5f5f5',
        mb: 0
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          px: { xs: 2, md: 4 },
          py: { xs: 4, md: 6 }
        }}
      >
        <Box sx={{ mb: 2, width: '200px', height: '200px' }}>
          <img 
            src="/email.png" 
            alt="Email Verification" 
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }} 
          />
        </Box>

        <Typography
          variant="h3"
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 500,
            color: '#2D3748',
            mb: 3,
            fontSize: '36px'
          }}
        >
          {isRTL ? 'ברכות!' : 'Congratulations!'}
        </Typography>

        <Typography
          variant="body1"
          sx={{ 
            mb: 4,
            color: '#4A4A4A',
            maxWidth: '600px',
            mx: 'auto',
            lineHeight: 1.6,
            fontSize: '16px'
          }}
        >
          {isRTL
            ? 'תודה שנרשמת! אנא בדוק את תיבת הדואר שלך לקבלת מייל אימות והוראות להמשך.'
            : 'Thank you for signing up! Please check your inbox for a verification email and instructions to get started.'}
        </Typography>

        <Box 
          sx={{ 
            width: '100%', 
            maxWidth: '600px', 
            mt: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '1px',
              bgcolor: '#E2E8F0',
              mb: 4
            }}
          />
          
          <Typography 
            variant="body2"
            sx={{ 
              mb: 3,
              color: '#4A4A4A',
              fontSize: '14px'
            }}
          >
            {isRTL
              ? 'לשליחה חוזרת של מייל האימות, לחץ על הכפתור למטה.'
              : 'To re-send the verification email, click the button below.'}
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={handleResendEmail}
            disabled={isLoading}
            sx={{ 
              position: 'relative',
              bgcolor: '#1976d2',
              '&:hover': {
                bgcolor: '#1565c0'
              },
              borderRadius: 1,
              py: 1.5,
              px: 3,
              textTransform: 'none',
              fontSize: '14px',
              maxWidth: '300px'
            }}
          >
            {isLoading ? (
              <CircularProgress
                size={24}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                  color: '#fff'
                }}
              />
            ) : (
              isRTL ? 'שלח שוב את מייל האימות' : 'Re-send Verification'
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default EmailConfirmation; 