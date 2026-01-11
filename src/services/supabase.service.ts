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
