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
export interface SignupUserResult {
  user: {
    id: string;
    email: string;
  };
  emailSent: boolean;
}

export interface CreateUserError {
  code: 'USER_EXISTS' | 'WEAK_PASSWORD' | 'INVALID_EMAIL' | 'UNKNOWN';
  message: string;
}

/**
 * Sign up a new user in Supabase - sends verification email
 */
export const signupSupabaseUser = async (
  email: string,
  password: string
): Promise<{ success: true; data: SignupUserResult } | { success: false; error: CreateUserError }> => {
  try {
    const client = getSupabaseClient();

    // Use signUp instead of admin.createUser to trigger verification email
    const { data, error } = await client.auth.signUp({
      email,
      password
    });

    if (error) {
      console.error('Supabase signUp error:', error.message, error);
      if (error.message.includes('already been registered') || error.message.includes('already registered')) {
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

    // Check if user already exists (Supabase returns user without error but with identities = [])
    if (data.user.identities && data.user.identities.length === 0) {
      return { success: false, error: { code: 'USER_EXISTS', message: 'User already exists with this email' } };
    }

    return {
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email || ''
        },
        emailSent: true
      }
    };
  } catch (error) {
    console.error('Signup Supabase user error:', error);
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
