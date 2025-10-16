import { q } from '../lib/db';
import { generateUserId, generateWalletId } from '../lib/idGenerator';

async function createAdminUser() {
  const email = 'admin@litxtech.com';
  const password = 'LitxAdmin2025!';
  const name = 'Admin';
  
  try {
    console.log('🔧 Creating admin user...');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('');
    
    const existingUser = await q('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️  Admin user already exists with email:', email);
      console.log('User ID:', existingUser.rows[0].id);
      console.log('');
      console.log('To reset password, delete the user first:');
      console.log(`DELETE FROM users WHERE email = '${email}';`);
      return;
    }

    const userId = generateUserId();
    const walletId = generateWalletId(userId);
    
    const result = await q(
      `INSERT INTO users (
        user_id, 
        wallet_id, 
        email, 
        name,
        password_hash,
        email_verified,
        status, 
        created_at
      ) VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf', 12)), true, $6, NOW()) 
      RETURNING id, user_id, wallet_id, email`,
      [userId, walletId, email, name, password, 'active']
    );

    const newUser = result.rows[0];

    await q(
      `INSERT INTO user_roles (user_id, role_key) VALUES ($1, $2), ($1, $3)`,
      [newUser.id, 'admin', 'owner']
    );

    await q(
      `INSERT INTO user_settings (user_id, coins_balance) VALUES ($1, $2)`,
      [newUser.id, 1000]
    );

    console.log('✅ ADMIN USER CREATED SUCCESSFULLY!');
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 User ID:', userId);
    console.log('💰 Wallet ID:', walletId);
    console.log('🎭 Roles: admin, owner');
    console.log('💎 Starting Coins: 1000');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('🌐 Admin Panel: https://litxtechuk.com/admin');
    console.log('🌐 Or: https://www.litxtechuk.com/admin');
    console.log('');
    console.log('⚠️  IMPORTANT: Change password after first login!');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

createAdminUser()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
