import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = supabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => auth?.currentUser?.getIdToken() || null,
}) : null;

export function requireConfirmation(confirmed, operation) {
  if (confirmed !== true) {
    throw new Error(`Confirmation required before ${operation}.`);
  }
}

export async function saveWorkspaceSnapshot(userId, snapshot, { confirmed = false } = {}) {
  requireConfirmation(confirmed, 'writing the Orbit workspace snapshot');
  if (!supabase) return { data: null, error: new Error('Supabase is not configured yet.') };

  return supabase.from('workspace_snapshots').upsert({
    user_id: userId,
    snapshot,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}
