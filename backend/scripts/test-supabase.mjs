import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url) {
  console.error('Missing SUPABASE_URL / EXPO_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const key = serviceRoleKey || anonKey;
if (!key) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  try {
    const { data, error } = await supabase.from('admin_users').select('*').limit(1);
    if (error) {
      console.error('Query error:', error.message);
      process.exitCode = 2;
    } else {
      console.log('admin_users sample row(s):');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error('Unexpected error:', e);
    process.exitCode = 3;
  }
}

await main();
