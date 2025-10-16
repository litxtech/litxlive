// Centralize Supabase client usage to avoid missing env errors on web
import { supabase as libSupabase } from '@/lib/supabase';

export const supabase = libSupabase;
