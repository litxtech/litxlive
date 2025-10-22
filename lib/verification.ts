/**
 * LUMI Verification System
 * Handles phone, email, and admin verification
 */

export interface VerificationStatus {
  phone: boolean;
  email: boolean;
  admin: boolean;
  level: 'none' | 'yellow' | 'blue';
}

export class VerificationService {
  /**
   * Calculate verification level based on status
   */
  static calculateLevel(status: VerificationStatus): 'none' | 'yellow' | 'blue' {
    if (status.admin) {
      return 'blue'; // Admin verified (influencer/celebrity)
    }
    if (status.phone && status.email) {
      return 'yellow'; // Phone and email verified
    }
    return 'none'; // No verification
  }

  /**
   * Get verification badge info
   */
  static getBadgeInfo(level: 'none' | 'yellow' | 'blue') {
    switch (level) {
      case 'yellow':
        return {
          icon: '✓',
          color: '#FFD700',
          text: 'Verified',
          description: 'Phone & Email Verified'
        };
      case 'blue':
        return {
          icon: '✓',
          color: '#1E90FF',
          text: 'Verified',
          description: 'Admin Verified Influencer'
        };
      default:
        return {
          icon: '',
          color: '',
          text: '',
          description: ''
        };
    }
  }

  /**
   * Check if user can get yellow verification
   */
  static canGetYellowVerification(phone: boolean, email: boolean): boolean {
    return phone && email;
  }

  /**
   * Check if user can get blue verification
   */
  static canGetBlueVerification(isAdmin: boolean): boolean {
    return isAdmin;
  }

  /**
   * Get verification requirements
   */
  static getRequirements(level: 'none' | 'yellow' | 'blue') {
    switch (level) {
      case 'yellow':
        return [
          'Verify phone number',
          'Verify email address'
        ];
      case 'blue':
        return [
          'Admin approval required',
          'Must be influencer/celebrity'
        ];
      default:
        return [
          'Complete profile',
          'Add phone number',
          'Add email address'
        ];
    }
  }
}

export default VerificationService;
