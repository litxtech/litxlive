import { supabase } from './supabase';
import type { Gender, GenderPreference } from '@/types/db';

export async function ensureProfileRow() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  const baseUsername = user.email?.split('@')[0] || `user_${user.id.slice(0, 6)}`;
  
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    console.log('[ensureProfileRow] Profile already exists');
    return;
  }

  console.log('[ensureProfileRow] Creating profile for user:', user.id);
  
  const { error } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      username: baseUsername,
      display_name: baseUsername,
      online_status: true,
      last_seen: new Date().toISOString(),
    });

  if (error) {
    console.error('[ensureProfileRow] Error:', error);
    throw error;
  }

  console.log('[ensureProfileRow] Profile created successfully');
}

export type OnboardingPayload = {
  gender: Gender;
  gender_preference: GenderPreference;
  age: number;
  city: string;
  country_code?: string;
  bio?: string;
};

export async function completeOnboarding(payload: OnboardingPayload) {
  if (!payload.gender || !payload.gender_preference) {
    throw new Error('Gender fields are required');
  }

  if (!Number.isInteger(payload.age) || payload.age < 18 || payload.age > 100) {
    throw new Error('Age must be between 18 and 100');
  }

  if (!payload.city || payload.city.trim().length === 0) {
    throw new Error('City is required');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  await ensureProfileRow();

  console.log('[completeOnboarding] Updating profile with:', payload);

  const { error } = await supabase
    .from('profiles')
    .update({
      gender: payload.gender,
      gender_preference: payload.gender_preference,
      age: payload.age,
      city: payload.city,
      country: payload.country_code || null,
      bio: payload.bio?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) {
    console.error('[completeOnboarding] Error:', error);
    throw error;
  }

  console.log('[completeOnboarding] Profile updated successfully');
}
