import type { ApplicationPurpose, CompanyType, DocumentType } from '@/types/application';

export const APPLICATION_PURPOSES: { value: ApplicationPurpose; label: string }[] = [
  { value: 'agency', label: 'Agency' },
  { value: 'creator', label: 'Creator' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'partner', label: 'Partner' },
];

export const COMPANY_TYPES: { value: CompanyType; label: string }[] = [
  { value: 'individual', label: 'Individual / Sole Proprietor' },
  { value: 'ltd', label: 'Limited Company (LTD)' },
  { value: 'inc', label: 'Incorporated (Inc / A.Ş.)' },
  { value: 'other', label: 'Other' },
];

export const DOCUMENT_TYPES: { value: DocumentType; label: string; required: boolean }[] = [
  { value: 'national_id', label: 'National ID / Passport', required: true },
  { value: 'residence_proof', label: 'Residence Proof', required: true },
  { value: 'tax_certificate', label: 'Tax Certificate (if company)', required: false },
  { value: 'bank_statement', label: 'Bank Statement', required: true },
  { value: 'other', label: 'Other Documents', required: false },
];

export const CATEGORY_TAGS = [
  'Music',
  'Gaming',
  'Chat',
  'Education',
  'Business',
  'Entertainment',
  'Lifestyle',
  'Technology',
  'Art',
  'Sports',
  'Food',
  'Travel',
  'Fashion',
  'Health',
  'Finance',
];

export const COUNTRIES = [
  { code: 'TR', name: 'Turkey' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'GR', name: 'Greece' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IE', name: 'Ireland' },
];

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'In Review',
  info_requested: 'Info Requested',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const STATUS_COLORS: Record<string, string> = {
  draft: '#888',
  submitted: '#2196F3',
  in_review: '#FF9800',
  info_requested: '#9C27B0',
  approved: '#4CAF50',
  rejected: '#F44336',
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
export const MAX_FILES = 10;

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

export const NOTIFICATION_TEMPLATES = {
  submitted: {
    title: 'Application Received',
    body: 'Your application has been received. We will review it shortly.',
  },
  in_review: {
    title: 'Application Under Review',
    body: 'Your application is currently being reviewed by our team.',
  },
  info_requested: {
    title: 'Additional Information Required',
    body: 'We need additional information for your application. Please check the messages.',
  },
  approved: {
    title: 'Application Approved!',
    body: 'Congratulations! Your agency/partner application has been approved.',
  },
  rejected: {
    title: 'Application Not Approved',
    body: 'Unfortunately, your application could not be approved at this time.',
  },
  iban_verified: {
    title: 'IBAN Verified',
    body: 'Your payout account has been verified successfully.',
  },
  iban_rejected: {
    title: 'IBAN Verification Failed',
    body: 'Your IBAN could not be verified. Please check the details and try again.',
  },
  iban_name_mismatch: {
    title: 'IBAN Name Mismatch',
    body: 'The account holder name does not match your application details.',
  },
};
