import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Container,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Language as LanguageIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const isRTL = language === 'he';
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const validateForm = () => {
    let isValid = true;
    
    // ולידציה לאימייל
    if (!email) {
      setEmailError(isRTL ? 'שדה האימייל הוא חובה' : 'Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError(isRTL ? 'כתובת האימייל אינה תקינה' : 'Invalid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!isResettingPassword) {
      // ולידציה לסיסמה רק אם לא במצב איפוס סיסמה
      if (!password) {
        setPasswordError(isRTL ? 'שדה הסיסמה הוא חובה' : 'Password is required');
        isValid = false;
      } else if (password.length < 6) {
        setPasswordError(isRTL ? 'הסיסמה חייבת להכיל לפחות 6 תווים' : 'Password must be at least 6 characters');
        isValid = false;
      } else {
        setPasswordError('');
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingMessage(isRTL ? 'מתחבר...' : 'Logging in...');

    if (!validateForm()) {
      return;
    }

    try {
      if (isResettingPassword) {
        await resetPassword(email);
        toast.success(
          isRTL
            ? 'נשלח אימייל לאיפוס סיסמה'
            : 'Password reset email sent',
          {
            position: isRTL ? toast.POSITION.TOP_RIGHT : toast.POSITION.TOP_LEFT,
            rtl: isRTL
          }
        );
        setIsResettingPassword(false);
      } else {
        await login(email, password);
        navigate('/');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(
        isRTL 
          ? 'התחברות נכשלה. אנא בדוק את פרטי ההתחברות שלך.' 
          : 'Login failed. Please check your credentials.',
        {
          position: isRTL ? toast.POSITION.TOP_RIGHT : toast.POSITION.TOP_LEFT,
          rtl: isRTL
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'he' ? 'en' : 'he');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          gap: 1,
        }}
      >
        <IconButton onClick={toggleLanguage} color="primary">
          <LanguageIcon />
        </IconButton>
        <IconButton onClick={toggleDarkMode} color="primary">
          {isDarkMode ? <LightIcon /> : <DarkIcon />}
        </IconButton>
      </Box>
      
      <Container maxWidth="sm" sx={{ mt: 'auto', mb: 'auto' }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            sx={{ fontWeight: 600, mb: 4, textAlign: 'center' }}
          >
            {isResettingPassword 
              ? (isRTL ? 'שחזור סיסמה' : 'Reset Password')
              : (isRTL ? 'התחברות' : 'Login')}
          </Typography>
          
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: '100%',
              maxWidth: '500px',
            }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label={isRTL ? 'דואר אלקטרוני' : 'Email'}
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              helperText={emailError}
              placeholder="example@domain.com"
              dir={isRTL ? 'rtl' : 'ltr'}
              sx={{
                '& .MuiInputBase-input': {
                  textAlign: isRTL ? 'right' : 'left',
                  paddingRight: isRTL ? '32px' : '14px',
                  paddingLeft: isRTL ? '14px' : '32px'
                },
                '& .MuiOutlinedInput-root': {
                  '& input': {
                    textAlign: isRTL ? 'right' : 'left',
                  },
                  '& fieldset': {
                    textAlign: isRTL ? 'right' : 'left',
                    direction: isRTL ? 'rtl' : 'ltr'
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
                },
                '& .MuiFormHelperText-root': {
                  textAlign: isRTL ? 'right' : 'left',
                  marginRight: isRTL ? '14px' : 'unset',
                  marginLeft: isRTL ? 'unset' : '14px'
                }
              }}
            />
            
            {!isResettingPassword && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label={isRTL ? 'סיסמה' : 'Password'}
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!passwordError}
                helperText={passwordError}
                placeholder={isRTL ? 'הכנס סיסמה' : 'Enter password'}
                dir={isRTL ? 'rtl' : 'ltr'}
                sx={{
                  '& .MuiInputBase-input': {
                    textAlign: isRTL ? 'right' : 'left',
                    paddingRight: isRTL ? '32px' : '14px',
                    paddingLeft: isRTL ? '14px' : '32px'
                  },
                  '& .MuiOutlinedInput-root': {
                    '& input': {
                      textAlign: isRTL ? 'right' : 'left',
                    },
                    '& fieldset': {
                      textAlign: isRTL ? 'right' : 'left',
                      direction: isRTL ? 'rtl' : 'ltr'
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
                  },
                  '& .MuiFormHelperText-root': {
                    textAlign: isRTL ? 'right' : 'left',
                    marginRight: isRTL ? '14px' : 'unset',
                    marginLeft: isRTL ? 'unset' : '14px'
                  }
                }}
              />
            )}

            {!isResettingPassword && (
              <FormControlLabel
                control={
                  <Checkbox 
                    value="remember" 
                    color="primary" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                }
                label={isRTL ? 'זכור אותי' : 'Remember me'}
                sx={{ 
                  '&.MuiFormControlLabel-root': {
                    marginLeft: '0 !important',
                    marginRight: '0 !important'
                  }
                }}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{ 
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: '1.1rem',
                position: 'relative'
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
                  }}
                />
              ) : isResettingPassword ? (
                isRTL ? 'שלח הוראות איפוס' : 'Send Reset Instructions'
              ) : (
                isRTL ? 'התחבר' : 'Login'
              )}
            </Button>

            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => setIsResettingPassword(!isResettingPassword)}
                  sx={{ 
                    textDecoration: 'none',
                    color: 'primary.main',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {isResettingPassword
                    ? (isRTL ? 'חזור להתחברות' : 'Back to Login')
                    : (isRTL ? 'שכחת סיסמה?' : 'Forgot Password?')}
                </Link>
              </Grid>
              <Grid item>
                <Link 
                  component={RouterLink} 
                  to="/register" 
                  variant="body2" 
                  sx={{ 
                    textDecoration: 'none',
                    color: 'primary.main'
                  }}
                >
                  {isRTL ? 'אין לך חשבון? הירשם' : "Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 