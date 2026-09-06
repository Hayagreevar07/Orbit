import { auth } from '../lib/firebase';
import { createClient } from '@supabase/supabase-js';
import { requireConfirmation } from '../lib/supabase';

const mess21Url = import.meta.env.VITE_MESS21_SUPABASE_URL;
const mess21AnonKey = import.meta.env.VITE_MESS21_SUPABASE_ANON_KEY;
const mess21Supabase = mess21Url && mess21AnonKey ? createClient(mess21Url, mess21AnonKey, {
  accessToken: async () => auth?.currentUser?.getIdToken() || null,
}) : null;

export const mess21Configured = Boolean(mess21Supabase);

export async function addMess21Expense({ title, amount, category = 'Other', date, splitType = 'personal', confirmed = false }) {
  requireConfirmation(confirmed, 'inserting an expense into Mess-21');
  const user = auth?.currentUser;
  if (!mess21Supabase) throw new Error('Add VITE_MESS21_SUPABASE_URL and VITE_MESS21_SUPABASE_ANON_KEY to connect Mess-21.');
  if (!user) throw new Error('Sign in before connecting Orbit to Mess-21.');

  const payload = {
    title: title || category,
    amount: Number(amount),
    category,
    date: date || new Date().toISOString().slice(0, 10),
    split_type: splitType,
    added_by: user.uid,
  };

  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    throw new Error('Expense amount must be greater than zero.');
  }

  const { data: inserted, error: insertError } = await mess21Supabase
    .from('expenses')
    .insert(payload)
    .select('*')
    .single();

  if (insertError) throw new Error(`Mess-21 rejected the expense: ${insertError.message}`);
  if (!inserted?.id) throw new Error('Mess-21 did not return the created expense.');

  const { data: verifiedExpense, error: readError } = await mess21Supabase
    .from('expenses')
    .select('*')
    .eq('id', inserted.id)
    .eq('added_by', user.uid)
    .single();

  if (readError || !verifiedExpense) {
    throw new Error('The expense was written, but Orbit could not verify it from Mess-21.');
  }

  return { ...verifiedExpense, source: 'Mess-21' };
}
