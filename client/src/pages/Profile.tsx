import React, { useState, useContext } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Avatar,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isRTL = language === 'he';
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.user_metadata?.first_name || '',
    lastName: user?.user_metadata?.last_name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // מסיר את כל התווים שאינם ספרות או +
      let cleaned = value.replace(/[^\d+]/g, '');
      
      // מטפל במספר שמתחיל ב +972
      if (cleaned.startsWith('+972')) {
        if (cleaned.length > 4) {
          cleaned = '+972-' + cleaned.slice(4);
        }
      } 
      // מטפל במספר רגיל שמתחיל ב 0
      else if (cleaned.startsWith('0')) {
        if (cleaned.length > 3) {
          cleaned = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
        }
      }

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

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    };

    // ולידציה לטלפון
    if (!formData.phone) {
      newErrors.phone = isRTL ? 'שדה חובה' : 'Required field';
      isValid = false;
    } else {
      const phoneRegex = /^(?:(?:\+972-)|0)([5][\d]-\d{7})$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = isRTL 
          ? 'מספר טלפון לא תקין. הפורמט הנדרש: 05X-XXXXXXX או +972-5XXXXXXXX'
          : 'Invalid phone number. Required format: 05X-XXXXXXX or +972-5XXXXXXXX';
        isValid = false;
      }
    }

    // ולידציה לסיסמה אם המשתמש מנסה לעדכן אותה
    if (formData.currentPassword || formData.newPassword || formData.confirmNewPassword) {
      // בדיקת סיסמה נוכחית
      if (!formData.currentPassword) {
        newErrors.currentPassword = isRTL ? 'יש להזין את הסיסמה הנוכחית' : 'Current password is required';
        isValid = false;
      }

      // בדיקת סיסמה חדשה
      if (!formData.newPassword) {
        newErrors.newPassword = isRTL ? 'יש להזין סיסמה חדשה' : 'New password is required';
        isValid = false;
      } else {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[a-zA-Z]).{6,}$/;
        if (!passwordRegex.test(formData.newPassword)) {
          newErrors.newPassword = isRTL 
            ? 'הסיסמה חייבת להכיל לפחות: 6 תווים, אות גדולה, ספרה ותו מיוחד'
            : 'Password must contain at least: 6 characters, 1 uppercase letter, 1 number, and 1 special character';
          isValid = false;
        }
      }

      // בדיקת אימות סיסמה חדשה
      if (!formData.confirmNewPassword) {
        newErrors.confirmNewPassword = isRTL ? 'יש לאמת את הסיסמה החדשה' : 'Please confirm new password';
        isValid = false;
      } else if (formData.newPassword !== formData.confirmNewPassword) {
        newErrors.confirmNewPassword = isRTL ? 'הסיסמאות אינן תואמות' : 'Passwords do not match';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (!user) {
        throw new Error(isRTL ? 'משתמש לא מחובר' : 'User not logged in');
      }

      // אם המשתמש מנסה לעדכן את הסיסמה
      if (formData.currentPassword) {
        if (!user.email) {
          throw new Error(isRTL ? 'לא נמצא אימייל למשתמש' : 'User email not found');
        }

        // בדיקה שהסיסמה החדשה שונה מהסיסמה הנוכחית
        if (formData.currentPassword === formData.newPassword) {
          throw new Error(isRTL ? 'הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית' : 'New password should be different from the old password');
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: formData.currentPassword,
        });

        if (signInError) {
          throw new Error(isRTL ? 'הסיסמה הנוכחית שגויה' : 'Current password is incorrect');
        }

        const { error: updatePasswordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });

        if (updatePasswordError) throw updatePasswordError;
      }

      const { error: authError } = await supabase.auth.updateUser({
        email: formData.email,
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone.replace(/[^\d+]/g, '')
        }
      });

      if (authError) throw authError;

      // Update local user state
      const updatedUser = {
        ...user,
        email: formData.email,
        id: user.id,
        user_metadata: {
          ...user.user_metadata,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone.replace(/[^\d+]/g, '')
        },
        app_metadata: user.app_metadata,
        aud: user.aud,
        created_at: user.created_at,
        confirmed_at: user.confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        role: user.role,
        updated_at: user.updated_at
      };

      // איפוס שדות הסיסמה
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }));

      toast.success(isRTL ? 'הפרופיל עודכן בהצלחה' : 'Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || (isRTL ? 'שגיאה בעדכון הפרופיל' : 'Error updating profile'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
              fontSize: '2rem',
              mr: isRTL ? 0 : 1.875,
              ml: isRTL ? 1.875 : 0
            }}
          >
            {user?.user_metadata?.first_name?.[0] || 'U'}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              פרופיל משתמש
            </Typography>
            <Typography variant="body1" color="text.secondary">
              כאן תוכל לצפות ולערוך את פרטי המשתמש שלך
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {!isEditing ? (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                שם פרטי
              </Typography>
              <Typography variant="body1">
                {user?.user_metadata?.first_name}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                שם משפחה
              </Typography>
              <Typography variant="body1">
                {user?.user_metadata?.last_name}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                דואר אלקטרוני
              </Typography>
              <Typography variant="body1">
                {user?.email}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                מספר טלפון
              </Typography>
              <Typography variant="body1">
                {user?.user_metadata?.phone || 'לא הוגדר'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={() => setIsEditing(true)}
                sx={{ mt: 2 }}
              >
                ערוך פרטים
              </Button>
            </Grid>
          </Grid>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="שם פרטי"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="שם משפחה"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="דואר אלקטרוני"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="מספר טלפון"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={!!errors.phone}
                  helperText={errors.phone || 'לדוגמה: 050-1234567 או +972-501234567'}
                  placeholder="050-1234567"
                  inputProps={{
                    maxLength: 13
                  }}
                  required
                  sx={{
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                      direction: 'rtl'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={isRTL ? 'סיסמה נוכחית' : 'Current Password'}
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={handleChange}
                  error={!!errors.currentPassword}
                  helperText={errors.currentPassword}
                  FormHelperTextProps={{
                    style: {
                      direction: isRTL ? 'rtl' : 'ltr',
                      textAlign: isRTL ? 'right' : 'left',
                    }
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      direction: isRTL ? 'rtl !important' : 'ltr !important'
                    },
                    '& .MuiInputBase-input': {
                      textAlign: isRTL ? 'right !important' : 'left !important',
                      direction: isRTL ? 'rtl !important' : 'ltr !important',
                      paddingRight: isRTL ? '32px !important' : '14px !important',
                      paddingLeft: isRTL ? '14px !important' : '32px !important'
                    },
                    '& .MuiFormHelperText-root': {
                      direction: isRTL ? 'rtl !important' : 'ltr !important',
                      textAlign: isRTL ? 'right !important' : 'left !important',
                      marginLeft: '0 !important',
                      marginRight: '0 !important'
                    },
                    '& .MuiInputLabel-root': {
                      right: isRTL ? '32px !important' : 'unset !important',
                      left: isRTL ? 'unset !important' : '32px !important',
                      transformOrigin: isRTL ? 'right !important' : 'left !important'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={isRTL ? 'סיסמה חדשה' : 'New Password'}
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handleChange}
                  error={!!errors.newPassword}
                  helperText={errors.newPassword || (isRTL 
                    ? 'הסיסמה חייבת להכיל: אות גדולה, ספרה, תו מיוחד (!@#$% וכו׳) ולפחות 6 תווים. לדוגמה: Bara9!'
                    : 'Password must contain: uppercase letter, number, special character (!@#$% etc) and at least 6 characters. Example: Bara9!')}
                  placeholder={isRTL ? 'לדוגמה: Bara9!' : 'Example: Bara9!'}
                  FormHelperTextProps={{
                    style: {
                      direction: isRTL ? 'rtl' : 'ltr',
                      textAlign: isRTL ? 'right' : 'left',
                    }
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      direction: isRTL ? 'rtl !important' : 'ltr !important'
                    },
                    '& .MuiInputBase-input': {
                      textAlign: isRTL ? 'right !important' : 'left !important',
                      direction: isRTL ? 'rtl !important' : 'ltr !important',
                      paddingRight: isRTL ? '32px !important' : '14px !important',
                      paddingLeft: isRTL ? '14px !important' : '32px !important'
                    },
                    '& .MuiFormHelperText-root': {
                      direction: isRTL ? 'rtl !important' : 'ltr !important',
                      textAlign: isRTL ? 'right !important' : 'left !important',
                      marginLeft: '0 !important',
                      marginRight: '0 !important'
                    },
                    '& .MuiInputLabel-root': {
                      right: isRTL ? '32px !important' : 'unset !important',
                      left: isRTL ? 'unset !important' : '32px !important',
                      transformOrigin: isRTL ? 'right !important' : 'left !important'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={isRTL ? 'אימות סיסמה חדשה' : 'Confirm New Password'}
                  name="confirmNewPassword"
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  error={!!errors.confirmNewPassword}
                  helperText={errors.confirmNewPassword}
                  placeholder={isRTL ? 'הזן את הסיסמה החדשה שוב' : 'Re-enter your new password'}
                  FormHelperTextProps={{
                    style: {
                      direction: isRTL ? 'rtl' : 'ltr',
                      textAlign: isRTL ? 'right' : 'left',
                    }
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      direction: isRTL ? 'rtl !important' : 'ltr !important'
                    },
                    '& .MuiInputBase-input': {
                      textAlign: isRTL ? 'right !important' : 'left !important',
                      direction: isRTL ? 'rtl !important' : 'ltr !important',
                      paddingRight: isRTL ? '32px !important' : '14px !important',
                      paddingLeft: isRTL ? '14px !important' : '32px !important'
                    },
                    '& .MuiFormHelperText-root': {
                      direction: isRTL ? 'rtl !important' : 'ltr !important',
                      textAlign: isRTL ? 'right !important' : 'left !important',
                      marginLeft: '0 !important',
                      marginRight: '0 !important'
                    },
                    '& .MuiInputLabel-root': {
                      right: isRTL ? '32px !important' : 'unset !important',
                      left: isRTL ? 'unset !important' : '32px !important',
                      transformOrigin: isRTL ? 'right !important' : 'left !important'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'שומר שינויים...' : 'שמור שינויים'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        firstName: user?.user_metadata?.first_name || '',
                        lastName: user?.user_metadata?.last_name || '',
                        email: user?.email || '',
                        phone: user?.user_metadata?.phone || '',
                        currentPassword: '',
                        newPassword: '',
                        confirmNewPassword: ''
                      });
                    }}
                  >
                    ביטול
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Profile; 