export class JwtService {
  generateToken(payload: Record<string, unknown>, expiresIn: string = '7d') {
    const secret = process.env.JWT_SECRET ?? '';
    const header = { alg: 'HS256', typ: 'JWT' };
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + this.parseExpiry(expiresIn);
    const base64url = (obj: object) =>
      Buffer.from(JSON.stringify(obj)).toString('base64url');
    const unsigned = `${base64url(header)}.${base64url({ ...payload, iat, exp })}`;
    const signature = this.hmacSHA256(unsigned, secret);
    return `${unsigned}.${signature}`;
  }

  generateAdminToken(username: string, expiresIn: string = '7d'): string {
    const secret = process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET ?? '';
    const header = { alg: 'HS256', typ: 'JWT' };
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + this.parseExpiry(expiresIn);
    const payload = {
      role: 'admin',
      username,
      userId: 'admin-user',
      iat,
      exp
    };
    const base64url = (obj: object) =>
      Buffer.from(JSON.stringify(obj)).toString('base64url');
    const unsigned = `${base64url(header)}.${base64url(payload)}`;
    const signature = this.hmacSHA256(unsigned, secret);
    return `${unsigned}.${signature}`;
  }

  verifyToken<T extends object = Record<string, unknown>>(token: string): T {
    const secret = process.env.JWT_SECRET ?? '';
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) throw new Error('invalid token');
    const expected = this.hmacSHA256(`${h}.${p}`, secret);
    if (expected !== s) throw new Error('invalid signature');
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString()) as { exp?: number } & T;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('token expired');
    return payload as T;
  }

  decodeToken<T extends object = Record<string, unknown>>(token: string): T | null {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
      return JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as T;
    } catch {
      return null;
    }
  }

  private hmacSHA256(input: string, secret: string) {
    const crypto = require('crypto') as typeof import('crypto');
    return crypto.createHmac('sha256', secret).update(input).digest('base64url');
  }

  private parseExpiry(exp: string) {
    const m = /^([0-9]+)([smhd])$/.exec(exp) ?? ['','7','d'];
    const n = parseInt(m[1] ?? '7', 10);
    const unit = m[2] ?? 'd';
    switch (unit) {
      case 's': return n;
      case 'm': return n * 60;
      case 'h': return n * 3600;
      case 'd': return n * 86400;
      default: return 7 * 86400;
    }
  }
}

export const jwtService = new JwtService();
