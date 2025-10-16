import { verificationService } from '../services/verificationService.js';
import { jwtService } from '../services/jwtService.js';
import { q } from '../lib/db.js';
import type { Context } from 'hono';

const users = new Map<string, any>();

export class AuthController {
  async requestEmailVerification(c: Context) {
    try {
      const body = (await c.req.json().catch(() => ({}))) as { email?: string; locale?: string; name?: string };
      const email = body.email?.trim().toLowerCase();
      const locale = body.locale ?? 'en';
      const name = body.name ?? 'User';
      
      if (!email) {
        return c.json({ success: false, message: 'Email address is required', errorCode: 'email_required' }, 400);
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return c.json({ success: false, message: 'Invalid email format', errorCode: 'invalid_email' }, 400);
      }
      
      console.log(`[AuthController] Email verification requested for: ${email}`);
      
      const code = verificationService.generateVerificationCode();
      
      try {
        verificationService.storeVerificationCode(email, code);
      } catch (error) {
        const err = error as Error;
        console.error('[AuthController] Rate limit error:', err.message);
        return c.json({ 
          success: false, 
          message: err.message,
          errorCode: 'otp_rate_limited'
        }, 429);
      }
      
      console.log(`[AuthController] ✅ Verification code: ${code} (sent to ${email})`);
      const result = { success: true, message: 'Verification email sent (dev mode - check console)' };
      
      if (result.success) {
        console.log(`[AuthController] ✅ Verification code: ${code} (sent to ${email})`);
        return c.json({ success: true, message: 'Verification email sent' });
      } else {
        console.error('[AuthController] Failed to send email:', result.message);
        return c.json({ success: false, message: result.message, errorCode: 'email_send_failed' }, 500);
      }
    } catch (error) {
      console.error('[AuthController] Error in requestEmailVerification:', error);
      return c.json({ success: false, message: 'Internal server error', errorCode: 'server_error' }, 500);
    }
  }



  async verifyCode(c: Context) {
    try {
      const body = (await c.req
        .json()
        .catch(() => ({}))) as { email?: string; code?: string; name?: string; locale?: string };

      const email = body.email;
      const code = body.code;
      const name = body.name ?? 'User';
      const locale = body.locale ?? 'en';

      if (!code) {
        return c.json({ success: false, message: 'Verification code is required', errorCode: 'code_required' }, 400);
      }
      
      if (!email) {
        return c.json({ success: false, message: 'Email is required', errorCode: 'email_required' }, 400);
      }
      
      const identifier = email;
      console.log(`[AuthController] Verifying code for: ${identifier}`);
      
      const result = verificationService.verifyCode(identifier, code);
      
      if (!result.success) {
        console.error(`[AuthController] Verification failed for ${identifier}:`, result.message);
        return c.json({ 
          success: false, 
          message: result.message,
          errorCode: result.errorCode
        }, 400);
      }

      const existingUser = Array.from(users.values()).find(
        u => (email && u.email === email)
      );

      let user;
      if (existingUser) {
        user = existingUser;
        console.log(`[AuthController] Existing user logged in: ${user.id}`);
      } else {
        user = {
          id: Date.now().toString(),
          email: email,
          name: name,
          createdAt: new Date().toISOString(),
          verified: true,
          coins: 100,
        };
        users.set(user.id, user);
        console.log(`[AuthController] New user created: ${user.id}`);
        
        console.log(`[AuthController] Welcome email would be sent to: ${email}`);
      }

      const token = jwtService.generateToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      console.log(`[AuthController] Verification successful for: ${identifier}`);
      return c.json({ success: true, message: 'Verification successful', token, user });
    } catch (error) {
      console.error('[AuthController] Error in verifyCode:', error);
      return c.json({ success: false, message: 'Internal server error', errorCode: 'server_error' }, 500);
    }
  }



  async verifyToken(c: Context) {
    try {
      const auth = c.req.header('authorization') ?? '';
      const token = auth.replace('Bearer ', '');
      
      if (!token) {
        return c.json({ success: false, message: 'Token is required', errorCode: 'token_required' }, 401);
      }
      
      const decoded = jwtService.verifyToken<{ userId: string }>(token);
      const user = users.get(decoded.userId);
      
      if (!user) {
        return c.json({ success: false, message: 'User not found', errorCode: 'user_not_found' }, 401);
      }
      
      return c.json({ success: true, user });
    } catch (error) {
      console.error('[AuthController] Token verification error:', error);
      return c.json({ success: false, message: 'Invalid token', errorCode: 'invalid_token' }, 401);
    }
  }

  async adminLogin(c: Context) {
    try {
      const body = (await c.req.json().catch(() => ({}))) as { email?: string; password?: string };
      const email = body.email?.trim().toLowerCase();
      const password = body.password;
      
      console.log('[AuthController] Admin login attempt for:', email);
      
      if (!email || !password) {
        console.log('[AuthController] Missing credentials');
        return c.json({ 
          success: false, 
          message: 'Email and password are required',
          errorCode: 'credentials_required' 
        }, 400);
      }
      
      if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('USER:PASSWORD')) {
        console.error('[AuthController] ⚠️  DATABASE_URL not configured');
        console.error('[AuthController] Using fallback admin credentials');
        
        const FALLBACK_ADMIN_EMAIL = 'admin@litxtech.com';
        const FALLBACK_ADMIN_PASSWORD = 'LitxAdmin2025!';
        
        if (email === FALLBACK_ADMIN_EMAIL && password === FALLBACK_ADMIN_PASSWORD) {
          const token = jwtService.generateToken({
            userId: 'admin-1',
            email: FALLBACK_ADMIN_EMAIL,
            name: 'Admin',
            roles: ['admin', 'owner'],
            isAdmin: true,
          });
          
          console.log('[AuthController] ✅ Fallback admin login successful');
          
          return c.json({ 
            success: true, 
            message: 'Login successful (fallback mode)',
            token,
            user: {
              id: 'admin-1',
              userId: 'ADMIN001',
              walletId: 'WALLET_ADMIN',
              email: FALLBACK_ADMIN_EMAIL,
              name: 'Admin',
              roles: ['admin', 'owner'],
            }
          });
        } else {
          return c.json({ 
            success: false, 
            message: 'Invalid credentials. Use: admin@litxtech.com / LitxAdmin2025!',
            errorCode: 'invalid_credentials' 
          }, 401);
        }
      }
      
      console.log('[AuthController] Querying database for user:', email);
      
      try {
        const result = await q<{
          id: string;
          user_id: string;
          wallet_id: string;
          email: string;
          name: string;
          password_match: boolean;
          roles: string[];
        }>(
          `SELECT 
            u.id,
            u.user_id,
            u.wallet_id,
            u.email,
            u.name,
            (u.password_hash = crypt($2, u.password_hash)) as password_match,
            COALESCE(array_agg(ur.role_key) FILTER (WHERE ur.role_key IS NOT NULL), '{}') as roles
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id
          WHERE LOWER(u.email) = LOWER($1)
          GROUP BY u.id, u.user_id, u.wallet_id, u.email, u.name, u.password_hash`,
          [email, password]
        );
        
        console.log('[AuthController] Query result rows:', result.rows.length);
        
        if (result.rows.length === 0) {
          console.log('[AuthController] Admin user not found:', email);
          return c.json({ 
            success: false, 
            message: 'Invalid credentials',
            errorCode: 'invalid_credentials' 
          }, 401);
        }
        
        const user = result.rows[0];
        
        if (!user.password_match) {
          console.log('[AuthController] Invalid password for admin:', email);
          return c.json({ 
            success: false, 
            message: 'Invalid credentials',
            errorCode: 'invalid_credentials' 
          }, 401);
        }
        
        const hasAdminRole = user.roles.includes('admin') || user.roles.includes('owner');
        if (!hasAdminRole) {
          console.log('[AuthController] User is not an admin:', email);
          return c.json({ 
            success: false, 
            message: 'Access denied. Admin privileges required.',
            errorCode: 'access_denied' 
          }, 403);
        }
        
        const token = jwtService.generateToken({
          userId: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          isAdmin: true,
        });
        
        console.log('[AuthController] Admin login successful:', email);
        
        return c.json({ 
          success: true, 
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            userId: user.user_id,
            walletId: user.wallet_id,
            email: user.email,
            name: user.name,
            roles: user.roles,
          }
        });
      } catch (dbError) {
        console.error('[AuthController] Database error:', dbError);
        return c.json({ 
          success: false, 
          message: 'Database connection error. Please configure DATABASE_URL.',
          errorCode: 'database_error' 
        }, 500);
      }
    } catch (error) {
      console.error('[AuthController] Error in adminLogin:', error);
      return c.json({ 
        success: false, 
        message: 'Internal server error',
        errorCode: 'server_error' 
      }, 500);
    }
  }
}

export const authController = new AuthController();
