import React, { useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ChatPage from './pages/Chat';
import Shelters from './pages/Shelters';
import Equipment from './pages/Equipment';
import Profile from './pages/Profile';
import EmailConfirmation from './pages/EmailConfirmation';
import ResetPassword from './pages/ResetPassword';
import { toast } from 'react-toastify';
import { useAuth } from './hooks/useAuth';
import './App.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === 'he';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user && !user.email_confirmed_at) {
      navigate('/email-confirmation', { 
        state: { email: user.email }
      });
      toast.warn(
        isRTL 
          ? 'אנא אשר את כתובת האימייל שלך כדי להמשיך' 
          : 'Please verify your email to continue',
        {
          position: isRTL ? toast.POSITION.TOP_RIGHT : toast.POSITION.TOP_LEFT,
          rtl: isRTL
        }
      );
    }
  }, [isAuthenticated, user, navigate, isRTL]);

  if (!isAuthenticated || (user && !user.email_confirmed_at)) {
    return null;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <SidebarProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/email-confirmation" element={<EmailConfirmation />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Home />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="shelters" element={<Shelters />} />
                  <Route path="equipment" element={<Equipment />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Routes>
            </SidebarProvider>
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
};

export default App; 