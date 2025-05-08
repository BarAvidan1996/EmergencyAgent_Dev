import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Container,
  Paper,
  Dialog,
  DialogContent
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isRTL = language === 'he';
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);

  interface RecoveryInfo {
    token: string | null;
    type: string | null;
    email: string | null;
  }

  // Get the recovery token, type and email from URL parameters or hash
  const getRecoveryInfo = (): RecoveryInfo => {
    // Check URL search parameters first
    const searchParams = new URLSearchParams(location.search);
    const tokenFromSearch = searchParams.get('token') || searchParams.get('access_token');
    const typeFromSearch = searchParams.get('type');
    const emailFromSearch = searchParams.get('email');

    // If found in search params, return them
    if (tokenFromSearch) {
      return { 
        token: tokenFromSearch, 
        type: typeFromSearch,
        email: emailFromSearch
      };
    }

    // If not found in search params, check hash
    const hash = location.hash;
    if (!hash) return { token: null, type: null, email: null };
    
    // Remove the leading '#' and parse the parameters
    const hashParams = new URLSearchParams(hash.substring(1));
    
    // Get token, type and email from hash
    return {
      token: hashParams.get('token') || hashParams.get('access_token'),
      type: hashParams.get('type'),
      email: hashParams.get('email')
    };
  };

  const { token, type, email } = getRecoveryInfo();

  // Log the URL parameters for debugging
  React.useEffect(() => {
    console.log('URL:', `${location.pathname}${location.search}${location.hash}`);
    console.log('Search params:', location.search);
    console.log('Hash:', location.hash);
    console.log('Token:', token);
    console.log('Type:', type);
    console.log('Email:', email);
  }, [location, token, type, email]);

  // Set the session when the component mounts
  React.useEffect(() => {
    const setRecoverySession = async () => {
      if (token && type === 'recovery') {
        try {
          // Set the session with the recovery token
          const { data, error } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: token
          });

          if (error) {
            console.error('Error setting session:', error);
            setError(isRTL ? 'הלינק לאיפוס הסיסמה אינו תקף או שפג תוקפו' : 'Password reset link is invalid or has expired');
          }
        } catch (error) {
          console.error('Error setting session:', error);
        }
      }
    };

    setRecoverySession();
  }, [token, type, isRTL]);

  const validatePassword = (password: string): boolean => {
    // At least 6 characters, one uppercase letter, one number and one special character
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    return passwordRegex.test(password);
  };

  // Success dialog component
  const SuccessDialog = () => (
    <Dialog 
      open={showSuccessDialog} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 4,
          textAlign: 'center'
        }
      }}
    >
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <CheckCircleOutlineIcon 
            sx={{ 
              fontSize: 80, 
              color: '#6C5DD3',
              opacity: 0.8
            }} 
          />
        </Box>
        <Typography variant="h4" component="h2" gutterBottom>
          {isRTL ? 'הסיסמה שונתה!' : 'Password Changed!'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {isRTL ? 'הסיסמה שלך שונתה בהצלחה.' : 'Your password has been changed successfully.'}
        </Typography>
        <Button
          variant="contained"
          fullWidth
          onClick={() => navigate('/login')}
          sx={{
            bgcolor: '#6C5DD3',
            '&:hover': {
              bgcolor: '#5a4cb4'
            },
            height: '48px',
            borderRadius: '12px',
            textTransform: 'none',
            fontSize: '16px'
          }}
        >
          {isRTL ? 'חזרה להתחברות' : 'Back to Login'}
        </Button>
      </DialogContent>
    </Dialog>
  );

  const handleResetPassword = async () => {
    if (!token || type !== 'recovery' || !email) {
      setError(isRTL ? 'הלינק לאיפוס הסיסמה אינו תקף או שפג תוקפו' : 'Password reset link is invalid or has expired');
      return;
    }

    if (password !== confirmPassword) {
      setError(isRTL ? 'הסיסמאות אינן תואמות' : 'Passwords do not match');
      return;
    }

    if (!validatePassword(password)) {
      setError(
        isRTL 
          ? 'הסיסמה חייבת להכיל לפחות 6 תווים, אות גדולה אחת, מספר אחד ותו מיוחד אחד'
          : 'Password must contain at least 6 characters, one uppercase letter, one number and one special character'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First verify the recovery token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery'
      });

      if (verifyError) {
        throw verifyError;
      }

      // Then update the password
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      // Instead of immediately navigating, show the success dialog
      setShowSuccessDialog(true);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      if (error.message.includes('Token has expired') || error.message.includes('JWT expired')) {
        setError(isRTL ? 'הלינק לאיפוס הסיסמה פג תוקף' : 'Password reset link has expired');
      } else if (error.message.includes('Invalid token')) {
        setError(isRTL ? 'הלינק לאיפוס הסיסמה אינו תקף' : 'Invalid password reset link');
      } else {
        setError(error.message || (isRTL ? 'שגיאה באיפוס הסיסמה' : 'Error resetting password'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container 
      maxWidth={false} 
      sx={{ 
        minHeight: '100vh', 
        bgcolor: '#F5F5F5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Paper
        elevation={1}
        sx={{
          width: '100%',
          maxWidth: '500px',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          borderRadius: 2
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 600,
            color: '#2D2D2D',
            textAlign: 'center'
          }}
        >
          {isRTL ? 'שינוי סיסמה' : 'Change Your Password'}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: '#4A4A4A',
            mb: 2,
            textAlign: isRTL ? 'right' : 'left'
          }}
        >
          {isRTL
            ? 'הזן סיסמה חדשה למטה כדי לשנות את הסיסמה שלך.'
            : 'Enter a new password below to change your password.'}
        </Typography>

        <Box
          component="form"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%'
          }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label={isRTL ? 'סיסמה חדשה' : 'New Password'}
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!error}
            placeholder={isRTL ? 'לדוגמה: Bara9!' : 'Example: Bara9!'}
            dir={isRTL ? 'rtl' : 'ltr'}
            sx={{
              '& .MuiInputBase-input': {
                textAlign: isRTL ? 'right' : 'left',
                paddingRight: isRTL ? '32px' : '14px',
                paddingLeft: isRTL ? '14px' : '32px'
              },
              '& .MuiOutlinedInput-root': {
                height: '48px',
                '& input': {
                  textAlign: isRTL ? 'right' : 'left',
                },
                '& fieldset': {
                  borderColor: '#E5E5E5',
                  textAlign: isRTL ? 'right' : 'left',
                  direction: isRTL ? 'rtl' : 'ltr'
                },
                '&:hover fieldset': {
                  borderColor: '#6C5DD3',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6C5DD3',
                }
              },
              '& .MuiInputLabel-root': {
                right: isRTL ? '32px !important' : 'unset',
                left: isRTL ? 'unset !important' : '32px',
                transformOrigin: isRTL ? 'right' : 'left',
                textAlign: isRTL ? 'right' : 'left',
                direction: isRTL ? 'rtl' : 'ltr',
                '&.MuiInputLabel-shrink': {
                  transform: isRTL 
                    ? 'translate(-14px, -9px) scale(0.75)'
                    : 'translate(14px, -9px) scale(0.75)',
                  transformOrigin: isRTL ? 'top right' : 'top left'
                }
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label={isRTL ? 'אימות סיסמה' : 'Confirm Password'}
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!error}
            helperText={error}
            placeholder={isRTL ? 'הכנס סיסמה שוב' : 'Confirm your password'}
            dir={isRTL ? 'rtl' : 'ltr'}
            sx={{
              '& .MuiInputBase-input': {
                textAlign: isRTL ? 'right' : 'left',
                paddingRight: isRTL ? '32px' : '14px',
                paddingLeft: isRTL ? '14px' : '32px'
              },
              '& .MuiOutlinedInput-root': {
                height: '48px',
                '& input': {
                  textAlign: isRTL ? 'right' : 'left',
                },
                '& fieldset': {
                  borderColor: '#E5E5E5',
                  textAlign: isRTL ? 'right' : 'left',
                  direction: isRTL ? 'rtl' : 'ltr'
                },
                '&:hover fieldset': {
                  borderColor: '#6C5DD3',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6C5DD3',
                }
              },
              '& .MuiInputLabel-root': {
                right: isRTL ? '32px !important' : 'unset',
                left: isRTL ? 'unset !important' : '32px',
                transformOrigin: isRTL ? 'right' : 'left',
                textAlign: isRTL ? 'right' : 'left',
                direction: isRTL ? 'rtl' : 'ltr',
                '&.MuiInputLabel-shrink': {
                  transform: isRTL 
                    ? 'translate(-14px, -9px) scale(0.75)'
                    : 'translate(14px, -9px) scale(0.75)',
                  transformOrigin: isRTL ? 'top right' : 'top left'
                }
              }
            }}
          />

          <Typography
            variant="caption"
            sx={{
              color: '#718096',
              textAlign: isRTL ? 'right' : 'left',
              direction: isRTL ? 'rtl' : 'ltr'
            }}
          >
            {isRTL
              ? 'הסיסמה חייבת להכיל לפחות 6 תווים, אות גדולה אחת, מספר אחד ותו מיוחד אחד'
              : 'Password must contain at least 6 characters, one uppercase letter, one number and one special character'}
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={handleResetPassword}
            disabled={loading}
            sx={{
              mt: 2,
              height: '48px',
              bgcolor: '#6C5DD3',
              '&:hover': {
                bgcolor: '#5B4EAE'
              },
              '&.Mui-disabled': {
                bgcolor: '#E5E5E5'
              }
            }}
          >
            {loading ? (
              <CircularProgress
                size={24}
                sx={{
                  color: '#fff'
                }}
              />
            ) : (
              <Typography sx={{ fontWeight: 500, textTransform: 'none' }}>
                {isRTL ? 'עדכן סיסמה' : 'Reset Password'}
              </Typography>
            )}
          </Button>
        </Box>
      </Paper>

      {/* Success Dialog */}
      <SuccessDialog />
    </Container>
  );
};

export default ResetPassword; 