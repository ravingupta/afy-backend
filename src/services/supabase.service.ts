import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  if (supabase) return supabase;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined');
  }

  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabase;
};

export interface VerifiedSupabaseUser {
  id: string;
  email: string;
  phone?: string;
  emailConfirmedAt?: string;
  lastSignInAt?: string;
}

/**
 * Verify a Supabase access token and return user data
 */
export interface CreateUserResult {
  user: VerifiedSupabaseUser;
  accessToken: string;
}

export interface CreateUserError {
  code: 'USER_EXISTS' | 'WEAK_PASSWORD' | 'INVALID_EMAIL' | 'UNKNOWN';
  message: string;
}

/**
 * Create a new user in Supabase using Admin API
 */
export const createSupabaseUser = async (
  email: string,
  password: string
): Promise<{ success: true; data: CreateUserResult } | { success: false; error: CreateUserError }> => {
  try {
    const client = getSupabaseClient();

    // Create user with Admin API
    const { data, error } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm email for backend signup
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes('already been registered')) {
        return { success: false, error: { code: 'USER_EXISTS', message: 'User already exists with this email' } };
      }
      if (error.message.includes('password')) {
        return { success: false, error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters' } };
      }
      if (error.message.includes('email')) {
        return { success: false, error: { code: 'INVALID_EMAIL', message: 'Invalid email address' } };
      }
      return { success: false, error: { code: 'UNKNOWN', message: error.message } };
    }

    if (!data.user) {
      return { success: false, error: { code: 'UNKNOWN', message: 'Failed to create user' } };
    }

    // Sign in to get a session token for the new user
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (signInError || !signInData.session) {
      return { success: false, error: { code: 'UNKNOWN', message: 'User created but failed to generate session' } };
    }

    return {
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          phone: data.user.phone,
          emailConfirmedAt: data.user.email_confirmed_at,
          lastSignInAt: data.user.last_sign_in_at
        },
        accessToken: signInData.session.access_token
      }
    };
  } catch (error) {
    console.error('Create Supabase user error:', error);
    return { success: false, error: { code: 'UNKNOWN', message: 'Failed to create user' } };
  }
};

/**
 * Verify a Supabase access token and return user data
 */
export const verifySupabaseToken = async (token: string): Promise<VerifiedSupabaseUser | null> => {
  try {
    const client = getSupabaseClient();

    const { data: { user }, error } = await client.auth.getUser(token);

    if (error || !user) {
      console.error('Supabase token verification failed:', error?.message);
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      phone: user.phone,
      emailConfirmedAt: user.email_confirmed_at,
      lastSignInAt: user.last_sign_in_at
    };
  } catch (error) {
    console.error('Supabase verification error:', error);
    return null;
  }
};

export { getSupabaseClient };
export type { SupabaseUser };
