# 🚀 Quick Start - Fix Network Errors

## The Problem
You're seeing "TypeError: Network request failed" because Supabase environment variables are not configured.

## The Solution (5 Minutes)

### 1️⃣ Get Your Supabase Keys

Open this link: https://supabase.com/dashboard/project/cbzwohfekgxbvkwrll/settings/api

Copy these 3 values:
- **Project URL** (should be: `https://cbzwohfekgxbvkwrll.supabase.co`)
- **anon public key** (starts with `eyJhbGciOiJIUzI1NiI...`)
- **service_role key** (starts with `eyJhbGciOiJIUzI1NiI...`)

### 2️⃣ Update .env File

Open the `.env` file in your project root and replace the PLACEHOLDER values:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://cbzwohfekgxbvkwrll.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<paste_anon_key_here>
SUPABASE_SERVICE_ROLE_KEY=<paste_service_role_key_here>
```

### 3️⃣ Verify Configuration

Run this command:
```bash
node verify-env.js
```

You should see all ✅ green checkmarks.

### 4️⃣ Restart Server

Stop your dev server (Ctrl+C) and restart:
```bash
npm run start
```

### 5️⃣ Test Connection

In your app, navigate to: `/test-connection`

All tests should pass ✅

## Create Test User

### Option 1: Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/cbzwohfekgxbvkwrll/auth/users
2. Click "Add user"
3. Email: `support@litxtech.com`
4. Password: `Bavul2017?`
5. ✅ Check "Auto Confirm User"
6. Click "Create user"

### Option 2: App Signup
1. Open app → `/auth`
2. Click "Sign Up"
3. Fill in details
4. Check email for verification

## Add Unlimited Coins

Go to Supabase SQL Editor and run:

```sql
UPDATE profiles 
SET coins = 999999999, is_vip = true 
WHERE id = (SELECT id FROM auth.users WHERE email = 'support@litxtech.com');
```

## Test Everything

- [ ] Sign in with test user
- [ ] Check coins balance (should be 999999999)
- [ ] Start a video call
- [ ] Send messages
- [ ] Test all features

## Still Having Issues?

1. **Check console logs** - Look for error messages
2. **Run `/test-connection`** - See which test fails
3. **Verify Supabase project** - Make sure it's not paused
4. **Check internet connection** - Can you access supabase.com?

## Important URLs

- **Supabase Dashboard**: https://supabase.com/dashboard/project/cbzwohfekgxbvkwrll
- **API Settings**: https://supabase.com/dashboard/project/cbzwohfekgxbvkwrll/settings/api
- **Auth Users**: https://supabase.com/dashboard/project/cbzwohfekgxbvkwrll/auth/users
- **SQL Editor**: https://supabase.com/dashboard/project/cbzwohfekgxbvkwrll/sql

## Files to Check

1. `.env` - Must have real values (not PLACEHOLDER)
2. `lib/supabase.ts` - Should show "✅ Supabase client initialized"
3. `app/test-connection.tsx` - Diagnostic tool
4. `verify-env.js` - Environment checker

---

**Need more details?** Check `NETWORK-ERROR-FIX.md` and `SETUP-ENV-GUIDE.md`
