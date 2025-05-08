import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useLanguage } from '../contexts/LanguageContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useTheme } from '../contexts/ThemeContext';

const Layout: React.FC = () => {
  const { language } = useLanguage();
  const { isCollapsed } = useSidebar();
  const { isDarkMode } = useTheme();
  const isRTL = language === 'he';
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const location = useLocation();
  const isChatPage = location.pathname.includes('/chat');

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: isDarkMode ? '#1F1D2B' : '#F6F8FA' }}>
      <Sidebar 
        activeSessionId={activeSessionId}
        onSessionSelect={setActiveSessionId}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: '100%',
          ml: isChatPage ? 0 : (isRTL ? 0 : (isCollapsed ? '72px' : '280px')),
          mr: isChatPage ? 0 : (isRTL ? (isCollapsed ? '72px' : '280px') : 0),
          background: isChatPage
            ? (isDarkMode ? '#1F1D2B' : 'linear-gradient(to bottom, #f9f9ff, #eef2ff)')
            : (isDarkMode ? '#1F1D2B' : '#F6F8FA'),
          minHeight: '100vh',
        }}
      >
        <Box sx={{ 
          width: '100%', 
          maxWidth: '1200px',
          mx: 'auto'
        }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout; 