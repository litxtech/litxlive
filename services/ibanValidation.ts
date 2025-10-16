import type { IBANValidationResult } from '@/types/application';

const IBAN_LENGTHS: Record<string, number> = {
  AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22,
  BH: 22, BR: 29, BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22,
  DK: 18, DO: 28, EE: 20, EG: 29, ES: 24, FI: 18, FO: 18, FR: 27,
  GB: 22, GE: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21, HU: 28,
  IE: 22, IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28,
  LC: 32, LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22,
  MK: 19, MR: 27, MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28,
  PS: 29, PT: 25, QA: 29, RO: 24, RS: 22, SA: 24, SE: 24, SI: 19,
  SK: 24, SM: 27, TN: 24, TR: 26, UA: 29, VA: 22, VG: 24, XK: 20,
};

function mod97(iban: string): number {
  let remainder = iban;
  let block;

  while (remainder.length > 2) {
    block = remainder.slice(0, 9);
    remainder = (parseInt(block, 10) % 97) + remainder.slice(block.length);
  }

  return parseInt(remainder, 10) % 97;
}

function validateIBANFormat(iban: string): { valid: boolean; country?: string; error?: string } {
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleanIBAN)) {
    return { valid: false, error: 'Invalid IBAN format' };
  }

  const countryCode = cleanIBAN.slice(0, 2);
  const expectedLength = IBAN_LENGTHS[countryCode];

  if (!expectedLength) {
    return { valid: false, error: 'Unknown country code' };
  }

  if (cleanIBAN.length !== expectedLength) {
    return { valid: false, error: `Invalid length for ${countryCode}` };
  }

  const rearranged = cleanIBAN.slice(4) + cleanIBAN.slice(0, 4);
  const numericIBAN = rearranged.replace(/[A-Z]/g, (char) => 
    (char.charCodeAt(0) - 55).toString()
  );

  const checksumValid = mod97(numericIBAN) === 1;

  if (!checksumValid) {
    return { valid: false, error: 'Invalid checksum' };
  }

  return { valid: true, country: countryCode };
}

function calculateNameMatchScore(name1: string, name2: string): number {
  const normalize = (str: string) => 
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const n1 = normalize(name1);
  const n2 = normalize(name2);

  if (n1 === n2) return 100;

  const words1 = n1.split(' ');
  const words2 = n2.split(' ');

  let matchCount = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchCount++;
        break;
      }
    }
  }

  const maxWords = Math.max(words1.length, words2.length);
  const score = (matchCount / maxWords) * 100;

  return Math.round(score);
}

export function validateIBAN(
  iban: string,
  accountHolderName: string,
  applicantName: string
): IBANValidationResult {
  console.log('[IBAN Validation] Starting validation', { iban: iban.slice(0, 4) + '***' });

  const formatCheck = validateIBANFormat(iban);

  if (!formatCheck.valid) {
    console.log('[IBAN Validation] Format check failed', formatCheck.error);
    return {
      valid: false,
      checksum_valid: false,
      name_mismatch: true,
      error: formatCheck.error,
    };
  }

  const nameMatchScore = calculateNameMatchScore(accountHolderName, applicantName);
  const nameMismatch = nameMatchScore < 85;

  console.log('[IBAN Validation] Name match score', { 
    score: nameMatchScore, 
    mismatch: nameMismatch 
  });

  return {
    valid: true,
    country: formatCheck.country,
    checksum_valid: true,
    name_match: nameMatchScore,
    name_mismatch: nameMismatch,
  };
}

export function formatIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') || clean;
}

export function maskIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, '');
  if (clean.length < 8) return '****';
  return clean.slice(0, 4) + '****' + clean.slice(-4);
}
