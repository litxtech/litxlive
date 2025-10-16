import { pool, q } from '../lib/db.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDatabase() {
  console.log('🚀 Starting database initialization...');
  
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('Please check your DATABASE_URL in .env file');
    process.exit(1);
  }

  try {
    console.log('📋 Running schema.sql...');
    const schemaPath = join(__dirname, '../sql/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    console.log('✅ Schema created successfully');
  } catch (error) {
    console.error('❌ Schema creation failed:', error);
    throw error;
  }

  try {
    console.log('🌱 Running seed.sql...');
    const seedPath = join(__dirname, '../sql/seed.sql');
    const seed = readFileSync(seedPath, 'utf-8');
    await pool.query(seed);
    console.log('✅ Seed data inserted successfully');
  } catch (error) {
    console.error('❌ Seed data insertion failed:', error);
    throw error;
  }

  try {
    console.log('👤 Creating admin user...');
    
    const adminEmail = 'admin@litxtech.com';
    const adminPassword = 'LitxAdmin2025!Secure';
    const adminName = 'LITX Admin';
    
    const userIdPublic = `LTX-2025-${String(1).padStart(6, '0')}`;
    const walletId = `WAL-${userIdPublic}`;
    
    const existingAdmin = await q(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin user already exists');
      const adminId = existingAdmin.rows[0].id;
      
      await q(
        'UPDATE users SET password_hash = crypt($1, gen_salt(\'bf\')) WHERE id = $2',
        [adminPassword, adminId]
      );
      console.log('✅ Admin password updated');
      
      const roleCheck = await q(
        'SELECT 1 FROM user_roles WHERE user_id = $1 AND role_key = $2',
        [adminId, 'owner']
      );
      
      if (roleCheck.rows.length === 0) {
        await q(
          'INSERT INTO user_roles (user_id, role_key) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [adminId, 'owner']
        );
        console.log('✅ Admin role assigned');
      }
    } else {
      const result = await q(
        `INSERT INTO users (user_id, wallet_id, email, name, password_hash, status)
         VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf')), 'active')
         RETURNING id`,
        [userIdPublic, walletId, adminEmail, adminName, adminPassword]
      );
      
      const adminId = result.rows[0].id;
      
      await q(
        'INSERT INTO user_roles (user_id, role_key) VALUES ($1, $2)',
        [adminId, 'owner']
      );
      
      await q(
        'INSERT INTO user_settings (user_id, coins_balance) VALUES ($1, $2)',
        [adminId, 0]
      );
      
      await q(
        'INSERT INTO user_profiles (user_id, blue_tick, kyc_status) VALUES ($1, $2, $3)',
        [adminId, true, 'verified']
      );
      
      console.log('✅ Admin user created successfully');
    }
    
    console.log('\n🎉 Database initialization complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Admin Email:    admin@litxtech.com');
    console.log('🔑 Admin Password: LitxAdmin2025!Secure');
    console.log('🌐 Admin Panel:    https://www.litxtechuk.com/admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANT: Change the admin password after first login!\n');
    
  } catch (error) {
    console.error('❌ Admin user creation failed:', error);
    throw error;
  }

  await pool.end();
  console.log('✅ Database connection closed');
}

initDatabase().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
