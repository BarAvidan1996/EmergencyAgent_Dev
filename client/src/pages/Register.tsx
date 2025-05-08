import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Grid,
  InputAdornment,
  IconButton,
  CircularProgress,
  IconButton as MuiIconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Language as LanguageIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { SignUpCredentials } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface RegisterFormData extends SignUpCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const isRTL = language === 'he';
  const [loadingMessage, setLoadingMessage] = useState('');

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    };

    // ולידציה לשם פרטי
    if (!formData.firstName) {
      newErrors.firstName = isRTL ? 'שדה חובה' : 'Required field';
      isValid = false;
    }

    // ולידציה לשם משפחה
    if (!formData.lastName) {
      newErrors.lastName = isRTL ? 'שדה חובה' : 'Required field';
      isValid = false;
    }

    // ולידציה לאימייל
    if (!formData.email) {
      newErrors.email = isRTL ? 'שדה חובה' : 'Required field';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = isRTL ? 'כתובת אימייל לא תקינה' : 'Invalid email address';
      isValid = false;
    }

    // ולידציה לטלפון
    if (!formData.phone) {
      newErrors.phone = isRTL ? 'שדה חובה' : 'Required field';
      isValid = false;
    } else {
      // נקה את המספר לבדיקה
      const cleanPhone = formData.phone.replace(/[^\d]/g, '');
      if (!cleanPhone.match(/^0[5]\d{8}$/)) {
        newErrors.phone = isRTL 
          ? 'מספר טלפון לא תקין. הפורמט הנדרש: 05X-XXXXXXX'
          : 'Invalid phone number. Required format: 05X-XXXXXXX';
        isValid = false;
      }
    }

    // ולידציה לסיסמה
    if (!formData.password) {
      newErrors.password = isRTL ? 'שדה חובה' : 'Required field';
      isValid = false;
    } else {
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[a-zA-Z]).{6,}$/;
      if (!passwordRegex.test(formData.password)) {
        newErrors.password = isRTL 
          ? 'הסיסמה חייבת להכיל לפחות: 6 תווים, אות גדולה, ספרה ותו מיוחד'
          : 'Password must contain at least: 6 characters, 1 uppercase letter, 1 number, and 1 special character';
        isValid = false;
      }
    }

    // ולידציה לאימות סיסמה
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = isRTL ? 'הסיסמאות אינן תואמות' : 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // נקה את מספר הטלפון מכל התווים חוץ ממספרים
      let cleaned = value.replace(/[^\d]/g, '');
      
      // אם המספר מתחיל ב-972, הסר את זה כדי לטפל בו כמו מספר רגיל
      if (cleaned.startsWith('972')) {
        cleaned = '0' + cleaned.substring(3);
      }
      
      // הוסף 0 בהתחלה אם צריך
      if (cleaned.length > 0 && !cleaned.startsWith('0')) {
        cleaned = '0' + cleaned;
      }
      
      // הוסף מקף אחרי שלוש ספרות ראשונות
      if (cleaned.length > 3) {
        cleaned = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
      }
      
      // הגבל את האורך הכולל
      cleaned = cleaned.slice(0, 11); // 050-1234567 = 11 תווים
      
      setFormData(prev => ({
        ...prev,
        [name]: cleaned
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingMessage(isRTL ? 'מתחבר...' : 'Logging in...');

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      });

      if (error) throw error;

      toast.success(
        isRTL ? 'הרשמה בוצעה בהצלחה!' : 'Registration successful!',
        {
          position: isRTL ? toast.POSITION.TOP_RIGHT : toast.POSITION.TOP_LEFT,
          rtl: isRTL
        }
      );

      // מעביר לדף האימות עם המייל
      navigate('/email-confirmation', { 
        state: { 
          email: formData.email,
          type: 'signup'
        } 
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(
        isRTL ? 'שגיאה בהרשמה' : 'Registration error',
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

      <Container component="main" maxWidth="sm" sx={{ mt: 'auto', mb: 'auto' }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 2,
          }}
        >
          <Typography component="h1" variant="h4" sx={{ mb: 4, textAlign: 'center', fontWeight: 600 }}>
            {isRTL ? 'הרשמה' : 'Register'}
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: '100%',
              maxWidth: '500px',
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="firstName"
                  label={isRTL ? 'שם פרטי' : 'First Name'}
                  name="firstName"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  placeholder={isRTL ? 'ישראל' : 'John'}
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label={isRTL ? 'שם משפחה' : 'Last Name'}
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  placeholder={isRTL ? 'ישראלי' : 'Doe'}
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
              </Grid>
            </Grid>

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label={isRTL ? 'דואר אלקטרוני' : 'Email'}
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              placeholder="example@domain.com"
              dir={isRTL ? 'rtl' : 'ltr'}
              sx={{
                mt: 2,
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

            <TextField
              margin="normal"
              required
              fullWidth
              name="phone"
              label={isRTL ? 'מספר טלפון' : 'Phone Number'}
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone || (isRTL 
                ? 'לדוגמה: 050-1234567 או +972-501234567'
                : 'Example: 050-1234567 or +972-501234567')}
              placeholder={isRTL ? '050-1234567' : '050-1234567'}
              dir={isRTL ? 'rtl' : 'ltr'}
              sx={{
                mt: 2,
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

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={isRTL ? 'סיסמה' : 'Password'}
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password || (isRTL 
                ? 'הסיסמה חייבת להכיל: אות גדולה, ספרה, תו מיוחד (!@#$% וכו׳) ולפחות 6 תווים. לדוגמה: Bara9!'
                : 'Password must contain: uppercase letter, number, special character (!@#$% etc) and at least 6 characters. Example: Bara9!')}
              placeholder={isRTL ? 'לדוגמה: Bara9!' : 'Example: Bara9!'}
              dir={isRTL ? 'rtl' : 'ltr'}
              sx={{
                mt: 2,
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

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label={isRTL ? 'אימות סיסמה' : 'Confirm Password'}
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              placeholder={isRTL ? 'הכנס סיסמה שוב' : 'Confirm your password'}
              dir={isRTL ? 'rtl' : 'ltr'}
              sx={{
                mt: 2,
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
                position: 'relative',
                minHeight: '48px'
              }}
            >
              {isLoading ? (
                <>
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
                  <Typography
                    variant="body2"
                    sx={{
                      position: 'absolute',
                      width: '100%',
                      textAlign: 'center',
                      color: 'text.secondary',
                      top: '120%'
                    }}
                  >
                    {loadingMessage}
                  </Typography>
                </>
              ) : (
                isRTL ? 'הרשמה' : 'Register'
              )}
            </Button>

            <Grid container justifyContent="center">
              <Grid item>
                <Link 
                  component={RouterLink} 
                  to="/login" 
                  variant="body2" 
                  sx={{ 
                    textDecoration: 'none',
                    color: 'primary.main'
                  }}
                >
                  {isRTL ? 'יש לך כבר חשבון? התחבר' : 'Already have an account? Sign in'}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register; 