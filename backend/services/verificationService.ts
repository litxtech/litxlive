interface VerificationCode {
  code: string;
  expiresAt: number;
  attempts: number;
  lastAttempt?: number;
  lastRequestTime?: number;
}

export class VerificationService {
  private codes = new Map<string, VerificationCode>();
  private readonly MAX_ATTEMPTS = 3;
  private readonly CODE_EXPIRY_MS = 5 * 60 * 1000;
  private readonly LOCKOUT_MS = 5 * 60 * 1000;
  private readonly RATE_LIMIT_MS = 60 * 1000;

  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  storeVerificationCode(identifier: string, code: string): void {
    const existing = this.codes.get(identifier);
    const now = Date.now();
    
    if (existing && existing.lastRequestTime) {
      const timeSinceLastRequest = now - existing.lastRequestTime;
      if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
        const remainingSeconds = Math.ceil((this.RATE_LIMIT_MS - timeSinceLastRequest) / 1000);
        throw new Error(`Too many requests. Please wait ${remainingSeconds} seconds before requesting a new code.`);
      }
    }

    this.codes.set(identifier, {
      code,
      expiresAt: now + this.CODE_EXPIRY_MS,
      attempts: 0,
      lastAttempt: undefined,
      lastRequestTime: now,
    });

    console.log(`[VerificationService] Stored code for ${identifier}: ${code} (expires in 5 minutes)`);
  }

  verifyCode(identifier: string, code: string): { success: boolean; message: string; errorCode?: string } {
    const stored = this.codes.get(identifier);
    const now = Date.now();

    if (!stored) {
      console.log(`[VerificationService] No code found for ${identifier}`);
      return { 
        success: false, 
        message: 'No verification code found. Please request a new one.',
        errorCode: 'otp_not_found'
      };
    }

    if (now > stored.expiresAt) {
      console.log(`[VerificationService] Code expired for ${identifier}`);
      this.codes.delete(identifier);
      return { 
        success: false, 
        message: 'Verification code expired. Please request a new one.',
        errorCode: 'otp_expired'
      };
    }

    if (stored.attempts >= this.MAX_ATTEMPTS) {
      const lockoutRemaining = this.LOCKOUT_MS - (now - (stored.lastAttempt ?? 0));
      if (lockoutRemaining > 0) {
        console.log(`[VerificationService] Account locked for ${identifier}`);
        return {
          success: false,
          message: `Too many failed attempts. Please wait ${Math.ceil(lockoutRemaining / 1000)} seconds.`,
          errorCode: 'otp_locked'
        };
      }
      stored.attempts = 0;
    }

    stored.attempts++;
    stored.lastAttempt = now;

    if (stored.code !== code) {
      const attemptsRemaining = this.MAX_ATTEMPTS - stored.attempts;
      console.log(`[VerificationService] Invalid code for ${identifier}. Attempts remaining: ${attemptsRemaining}`);
      
      if (attemptsRemaining === 0) {
        return {
          success: false,
          message: `Invalid code. Account locked for ${Math.ceil(this.LOCKOUT_MS / 1000)} seconds.`,
          errorCode: 'otp_locked'
        };
      }
      
      return {
        success: false,
        message: `Invalid code. ${attemptsRemaining} ${attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining.`,
        errorCode: 'otp_invalid'
      };
    }

    console.log(`[VerificationService] Code verified successfully for ${identifier}`);
    this.codes.delete(identifier);
    return { success: true, message: 'Verification successful' };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [identifier, data] of this.codes.entries()) {
      if (now > data.expiresAt + this.LOCKOUT_MS) {
        this.codes.delete(identifier);
      }
    }
  }
}

export const verificationService = new VerificationService();

setInterval(() => verificationService.cleanup(), 60000);
