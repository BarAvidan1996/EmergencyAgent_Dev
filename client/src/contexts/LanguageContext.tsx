import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'he' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  he: {
    'login': 'התחברות',
    'email': 'אימייל',
    'password': 'סיסמה',
    'login.button': 'התחבר',
    'register.link': 'אין לך חשבון? הירשם',
    'home': 'בית',
    'chat': 'צ\'אט',
    'shelters': 'מקלטים',
    'equipment': 'ציוד',
    'profile': 'פרופיל',
    'settings': 'הגדרות',
    'darkMode': 'מצב כהה',
    'language': 'שפה',
    'about': 'אודות',
    'faq': 'שאלות נפוצות',
    'logout': 'התנתק',
    'app.name': 'עילם',
    'app.description': 'עוזר ייעודי למצבי חירום',
  },
  en: {
    'login': 'Login',
    'email': 'Email',
    'password': 'Password',
    'login.button': 'Sign In',
    'register.link': 'Don\'t have an account? Sign Up',
    'home': 'Home',
    'chat': 'Chat',
    'shelters': 'Shelters',
    'equipment': 'Equipment',
    'profile': 'Profile',
    'settings': 'Settings',
    'darkMode': 'Dark Mode',
    'language': 'Language',
    'about': 'About',
    'faq': 'FAQ',
    'logout': 'Logout',
    'app.name': 'EILAM',
    'app.description': 'Emergency AI Assistant',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'he',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language');
    return (savedLang as Language) || 'he';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.dir = language === 'he' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['he']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}; 