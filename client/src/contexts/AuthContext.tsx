import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, AuthChangeEvent, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: SupabaseAuthError | null;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: SupabaseAuthError | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string; 
    phone?: string; 
  }) => Promise<{ error: SupabaseAuthError | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  supabase: SupabaseClient;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setState(prevState => ({ ...prevState, user: session.user, isAuthenticated: true }));
      }
    };
    checkSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setState(prevState => ({ ...prevState, user: session?.user ?? null, isAuthenticated: !!session?.user }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setState(prevState => ({
        ...prevState,
        user: data.user,
        isAuthenticated: true,
        error: null
      }));
    } catch (err) {
      setState(prevState => ({
        ...prevState,
        error: err as SupabaseAuthError
      }));
      throw err;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setState(prevState => ({ ...prevState, user: null, isAuthenticated: false }));
  };

  const register = async (userData: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string; 
    phone?: string; 
  }): Promise<{ error: SupabaseAuthError | null }> => {
    try {
      console.log('Attempting to register user:', userData.email);
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      console.log('Supabase signup response:', { data, error });

      if (error) {
        console.error('Supabase signup error:', error);
        return { error };
      }

      if (!data.user) {
        console.error('No user data returned from signup');
        return { error: { message: 'No user data returned from signup' } as SupabaseAuthError };
      }

      setState(prevState => ({
        ...prevState,
        user: data.user,
        isAuthenticated: true,
        error: null
      }));

      return { error: null };
    } catch (err) {
      console.error('Registration error:', err);
      setState(prevState => ({
        ...prevState,
        error: err as SupabaseAuthError
      }));
      return { error: err as SupabaseAuthError };
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        error: state.error,
        login,
        register,
        logout,
        resetPassword,
        supabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const handleError = (error: SupabaseAuthError): string => {
  if (!error) return 'An unknown error occurred';

  switch (error.code) {
    case '23505':
      return 'This email is already registered';
    case 'invalid-email':
      return 'Please enter a valid email address';
    case 'operation-not-allowed':
      return 'Operation not allowed';
    case 'weak-password':
      return 'Password should be at least 6 characters';
    case 'user-disabled':
      return 'This account has been disabled';
    default:
      return error.message || 'An unknown error occurred';
  }
}; 