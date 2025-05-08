import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth types
export interface SignUpCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

// Auth functions
export const signUp = async ({ email, password, firstName, lastName, phone }: SignUpCredentials) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      phone,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (authError) throw authError;

    // Update the user's phone number in the users table
    if (authData.user) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ phone: phone })
        .eq('id', authData.user.id);

      if (updateError) throw updateError;
    }

    return { data: authData, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signIn = async ({ email, password }: SignInCredentials) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}; 