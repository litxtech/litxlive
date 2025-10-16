import { q } from '../lib/db';

async function setupAdmin() {
  try {
    console.log('[Setup] Starting admin setup...');

    const email = 'admin@litxtech.com';
    const password = 'LITX2025Admin!Secure';
    const name = 'LITX Admin';

    const existingUser = await q('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      console.log('[Setup] Admin user already exists. Updating password...');
      
      await q(
        `UPDATE users 
         SET password_hash = crypt($1, gen_salt('bf', 10))
         WHERE email = $2`,
        [password, email]
      );

      console.log('[Setup] Password updated successfully.');
      console.log('\n=== ADMIN CREDENTIALS ===');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('URL: https://litxtechuk.com/admin');
      console.log('========================\n');
      return;
    }

    console.log('[Setup] Creating new admin user...');

    const userResult = await q(
      `INSERT INTO users (
        user_id, 
        wallet_id, 
        email, 
        password_hash,
        name, 
        status, 
        created_at
      ) VALUES ($1, $2, $3, crypt($4, gen_salt('bf', 10)), $5, $6, NOW()) 
      RETURNING id, user_id, wallet_id, email`,
      ['LTX-2025-ADMIN', 'WAL-LTX-2025-ADMIN', email, password, name, 'active']
    );

    const newUser = userResult.rows[0];
    console.log('[Setup] User created:', newUser.user_id);

    await q(
      `INSERT INTO roles (key) VALUES ('owner'), ('admin') 
       ON CONFLICT (key) DO NOTHING`
    );

    await q(
      `INSERT INTO user_roles (user_id, role_key) VALUES ($1, $2), ($1, $3)`,
      [newUser.id, 'owner', 'admin']
    );
    console.log('[Setup] Roles assigned: owner, admin');

    await q(
      `INSERT INTO user_profiles (user_id, blue_tick, kyc_status, badges) 
       VALUES ($1, $2, $3, $4)`,
      [newUser.id, true, 'approved', ['verified', 'owner']]
    );
    console.log('[Setup] Profile created with blue tick');

    await q(
      `INSERT INTO user_settings (user_id, coins_balance) VALUES ($1, $2)`,
      [newUser.id, 10000]
    );
    console.log('[Setup] Settings initialized with 10,000 coins');

    console.log('\n=== ADMIN USER CREATED SUCCESSFULLY ===');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', newUser.user_id);
    console.log('Wallet ID:', newUser.wallet_id);
    console.log('Role: Owner + Admin');
    console.log('URL: https://litxtechuk.com/admin');
    console.log('======================================\n');

  } catch (error) {
    console.error('[Setup] Error:', error);
    throw error;
  }
}

setupAdmin()
  .then(() => {
    console.log('[Setup] Completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Setup] Failed:', error);
    process.exit(1);
  });
