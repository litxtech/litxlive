/**
 * LUMI-ID Generation and Management System
 * Generates unique LUMI-IDs for users (e.g., LUMI-123456)
 */

export class LumiIdService {
  private static usedIds = new Set<string>();

  /**
   * Generate a unique LUMI-ID
   * Format: LUMI-XXXXXX (6 digits)
   */
  static generateLumiId(): string {
    let lumiId: string;
    let attempts = 0;
    const maxAttempts = 1000;

    do {
      const randomNumber = Math.floor(Math.random() * 1000000);
      lumiId = `LUMI-${randomNumber.toString().padStart(6, '0')}`;
      attempts++;
    } while (this.usedIds.has(lumiId) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique LUMI-ID');
    }

    this.usedIds.add(lumiId);
    return lumiId;
  }

  /**
   * Validate LUMI-ID format
   */
  static isValidLumiId(lumiId: string): boolean {
    const pattern = /^LUMI-\d{6}$/;
    return pattern.test(lumiId);
  }

  /**
   * Extract number from LUMI-ID
   */
  static extractNumber(lumiId: string): number {
    if (!this.isValidLumiId(lumiId)) {
      throw new Error('Invalid LUMI-ID format');
    }
    return parseInt(lumiId.split('-')[1]);
  }

  /**
   * Check if LUMI-ID is available
   */
  static isAvailable(lumiId: string): boolean {
    return !this.usedIds.has(lumiId);
  }

  /**
   * Reserve a LUMI-ID
   */
  static reserveLumiId(lumiId: string): boolean {
    if (this.usedIds.has(lumiId)) {
      return false;
    }
    this.usedIds.add(lumiId);
    return true;
  }

  /**
   * Release a LUMI-ID
   */
  static releaseLumiId(lumiId: string): void {
    this.usedIds.delete(lumiId);
  }
}

export default LumiIdService;
