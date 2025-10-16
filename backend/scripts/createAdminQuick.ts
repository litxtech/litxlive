import { pool } from '../lib/db.js';

async function createAdminUser() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating admin user...');
    
    await client.query('BEGIN');
    
    const adminEmail = 'admin@litxtech.com';
    const adminPassword = 'LitxAdmin2025!';
    const adminName = 'Admin';
    
    const checkUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (checkUser.rows.length > 0) {
      console.log('⚠️  Admin user already exists');
      await client.query('ROLLBACK');
      return;
    }
    
    const userResult = await client.query(
      `INSERT INTO users (user_id, wallet_id, email, name, password_hash, email_verified, created_at)
       VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf')), true, NOW())
       RETURNING id`,
      ['ADMIN001', 'WALLET_ADMIN', adminEmail, adminName, adminPassword]
    );
    
    const userId = userResult.rows[0].id;
    
    await client.query(
      `INSERT INTO user_roles (user_id, role_key)
       VALUES ($1, 'admin'), ($1, 'owner')`,
      [userId]
    );
    
    await client.query('COMMIT');
    
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminUser().catch(console.error);
