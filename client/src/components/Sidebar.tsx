import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Divider,
  Avatar,
  Stack,
  Tooltip,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Home as HomeIcon,
  Info as InfoIcon,
  QuestionAnswer as FAQIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
  Person as ProfileIcon,
  Inventory as InventoryIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { useSidebar } from '../contexts/SidebarContext';
import { createClient } from '@supabase/supabase-js';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 72;

const supabaseUrl = 'https://lfmxtaefgvjbuipcdcya.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmbXh0YWVmZ3ZqYnVpcGNkY3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyOTg5NDksImV4cCI6MjA1OTg3NDk0OX0.GfUDSLhxwdTEOKDyewAipXnZE_suNjKQba6x0q3QKEE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface SidebarProps {
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSessionId, onSessionSelect }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const muiTheme = useMuiTheme();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toggleDrawer = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'he' ? 'en' : 'he');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isRTL = language === 'he';

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      setError('Failed to load chat sessions');
      console.error(err);
    }
  };

  const handleRename = async (sessionId: string) => {
    if (!newTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ title: newTitle })
        .eq('id', sessionId);

      if (error) throw error;
      
      setEditingId(null);
      fetchSessions();
    } catch (err) {
      setError('Failed to rename session');
      console.error(err);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק שיחה זו?')) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      fetchSessions();
    } catch (err) {
      setError('Failed to delete session');
      console.error(err);
    }
  };

  const truncateTitle = (title: string, maxLength: number = 30) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  return (
    <Drawer
      variant="permanent"
      anchor={isRTL ? 'right' : 'left'}
      sx={{
        width: isCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: isDarkMode ? '#FFFFFF' : '#1F1D2B',
          color: isDarkMode ? '#1F1D2B' : 'white',
          border: 'none',
          boxShadow: isDarkMode 
            ? '0 8px 32px 0 rgba(0, 0, 0, 0.1)' 
            : '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: isDarkMode 
              ? '0 8px 32px 0 rgba(0, 0, 0, 0.15)' 
              : '0 8px 32px 0 rgba(31, 38, 135, 0.47)',
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {isCollapsed ? (
          // Collapsed View
          <>
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}>
              <IconButton 
                onClick={toggleDrawer}
                sx={{
                  color: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    color: isDarkMode ? '#000' : '#fff',
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            </Box>

            <Divider sx={{ 
              borderColor: isDarkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' 
            }} />

            <List sx={{ px: 1, flexGrow: 1 }}>
              {[
                { icon: <HomeIcon />, text: isRTL ? 'בית' : 'Home', path: '/' },
                { icon: <InventoryIcon />, text: isRTL ? 'רשימות הציוד שלי' : 'My Equipment Lists', path: '/equipment' },
                { icon: <LocationIcon />, text: isRTL ? 'מקלטים מועדפים' : 'Favorite Shelters', path: '/favorite-shelters' },
                { icon: <FAQIcon />, text: isRTL ? 'שאלות נפוצות' : 'FAQ', path: '/faq' },
              ].map((item) => (
                <ListItem
                  key={item.path}
                  component={Link}
                  to={item.path}
                  sx={{
                    borderRadius: 2,
                    minHeight: 48,
                    px: 2.5,
                    justifyContent: 'center',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <Tooltip title={item.text} placement={isRTL ? 'left' : 'right'}>
                    <ListItemIcon sx={{
                      minWidth: 0,
                      justifyContent: 'center',
                      color: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                    }}>
                      {item.icon}
                    </ListItemIcon>
                  </Tooltip>
                </ListItem>
              ))}
            </List>

            <Box sx={{ p: 2 }}>
              <Stack spacing={2} alignItems="center">
                <Tooltip title={isRTL ? 'פרופיל' : 'Profile'} placement={isRTL ? 'left' : 'right'}>
                  <Avatar
                    component={Link}
                    to="/profile"
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: '#6C5DD3',
                      border: `2px solid ${isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'}`,
                      cursor: 'pointer',
                      textDecoration: 'none',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                  >
                    {user?.user_metadata?.first_name?.[0] || 'U'}
                  </Avatar>
                </Tooltip>
                
                <Tooltip title={t('logout')} placement={isRTL ? 'left' : 'right'}>
                  <IconButton
                    onClick={handleLogout}
                    size="small"
                    sx={{
                      color: '#FF5C5C',
                      '&:hover': {
                        color: '#FF3333',
                      },
                    }}
                  >
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title={t('darkMode')} placement={isRTL ? 'left' : 'right'}>
                  <IconButton
                    onClick={toggleDarkMode}
                    size="small"
                    sx={{
                      color: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        color: isDarkMode ? '#000' : '#fff',
                      },
                    }}
                  >
                    {isDarkMode ? <LightIcon /> : <DarkIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title={t('language')} placement={isRTL ? 'left' : 'right'}>
                  <IconButton
                    onClick={toggleLanguage}
                    size="small"
                    sx={{
                      minWidth: 34,
                      height: 34,
                      color: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                  >
                    {language.toUpperCase()}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </>
        ) : (
          // Expanded View
          <>
            <Box
              component={Link}
              to="/"
              sx={{
                p: 3,
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'flex-start',
                position: 'relative',
              }}
            >
              <Box sx={{ 
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700,
                  fontSize: '2rem',
                  mb: 1,
                  background: 'linear-gradient(45deg, #6C5DD3, #7FBA7A)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: isDarkMode ? '0 0 1px rgba(0,0,0,0.2)' : '0 0 1px rgba(255,255,255,0.2)',
                  fontFamily: 'Heebo, Roboto, sans-serif',
                  letterSpacing: '0.5px'
                }}>
                  {isRTL ? "עילם" : "DEA"}
                </Typography>
                <Typography variant="subtitle1" sx={{ 
                  color: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1.1rem',
                  lineHeight: 1.4,
                  fontWeight: 400,
                  textAlign: 'center',
                  fontFamily: 'Heebo, Roboto, sans-serif',
                  letterSpacing: '0.3px'
                }}>
                  {isRTL ? "עוזר ייעודי למצבי חירום" : "Dedicated Emergency Assistant"}
                </Typography>
              </Box>
              <IconButton 
                onClick={(e) => {
                  e.preventDefault();
                  toggleDrawer();
                }}
                sx={{
                  position: 'absolute',
                  [isRTL ? 'left' : 'right']: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    color: isDarkMode ? '#000' : '#fff',
                  },
                }}
              >
                {isRTL ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
            </Box>

            <Divider sx={{ 
              borderColor: isDarkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' 
            }} />

            <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
              {/* Chat history will be added here */}
            </Box>

            <List sx={{ px: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  px: 2,
                  py: 1,
                  color: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textAlign: isRTL ? 'right' : 'left'
                }}
              >
                {isRTL ? 'עמודים' : 'Pages'}
              </Typography>
              {[
                { icon: <InventoryIcon />, text: isRTL ? 'רשימות הציוד שלי' : 'My Equipment Lists', path: '/equipment' },
                { icon: <LocationIcon />, text: isRTL ? 'מקלטים מועדפים' : 'Favorite Shelters', path: '/favorite-shelters' },
                { icon: <FAQIcon />, text: isRTL ? 'שאלות נפוצות' : 'FAQ', path: '/faq' },
              ].map((item) => (
                <ListItem
                  key={item.path}
                  button
                  component={Link}
                  to={item.path}
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    textAlign: isRTL ? 'right' : 'left',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                      pl: isRTL ? 2 : 3,
                      pr: isRTL ? 3 : 2,
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                    minWidth: 40,
                    mr: isRTL ? 0 : 2,
                    ml: isRTL ? 2 : 0,
                    '& svg': {
                      fontSize: '1.5rem'
                    }
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    sx={{ 
                      textAlign: isRTL ? 'right' : 'left',
                      '& .MuiListItemText-primary': { 
                        color: isDarkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        fontWeight: 500,
                        fontSize: '1.1rem',
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ 
              borderColor: isDarkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' 
            }} />

            <Box 
              sx={{ 
                p: 1.5,
                borderTop: `1px solid ${isDarkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
              }}
            >
              <Box sx={{ 
                mb: 1.5, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                p: 1,
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: isDarkMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                },
              }}>
                <Tooltip title={isRTL ? 'פרופיל' : 'Profile'} placement={isRTL ? 'left' : 'right'}>
                  <Avatar
                    component={Link}
                    to="/profile"
                    sx={{
                      width: 32, 
                      height: 32, 
                      bgcolor: '#6C5DD3',
                      border: `2px solid ${isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'}`,
                      cursor: 'pointer',
                      textDecoration: 'none',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                  >
                    {user?.user_metadata?.first_name?.[0] || 'U'}
                  </Avatar>
                </Tooltip>
                <Box>
                  <Typography variant="subtitle2" sx={{ letterSpacing: '0.2px' }}>
                    {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                    fontSize: '0.9rem',
                    fontWeight: 400,
                    fontFamily: 'Roboto, sans-serif',
                    letterSpacing: '0.2px'
                  }}>
                    {user?.email}
                  </Typography>
                </Box>
              </Box>

              <Stack 
                direction="row" 
                sx={{ 
                  justifyContent: 'space-between',
                  px: 2,
                }}
              >
                <Tooltip title={t('logout')}>
                  <IconButton
                    onClick={handleLogout}
                    size="small"
                    sx={{
                      color: '#FF5C5C',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: '#FF3333',
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('language')}>
                  <IconButton
                    onClick={toggleLanguage}
                    size="small"
                    sx={{
                      minWidth: 34,
                      height: 34,
                      color: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    {language.toUpperCase()}
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('darkMode')}>
                  <IconButton 
                    onClick={toggleDarkMode} 
                    size="small"
                    sx={{ 
                      color: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: isDarkMode ? '#000' : '#fff',
                        transform: 'rotate(180deg)',
                      },
                    }}
                  >
                    {isDarkMode ? <LightIcon /> : <DarkIcon />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar; 