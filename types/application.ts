export type ApplicationStatus = 
  | 'draft' 
  | 'submitted' 
  | 'in_review' 
  | 'info_requested' 
  | 'approved' 
  | 'rejected';

export type ApplicationPurpose = 
  | 'agency' 
  | 'creator' 
  | 'corporate' 
  | 'partner';

export type CompanyType = 
  | 'individual' 
  | 'ltd' 
  | 'inc' 
  | 'other';

export type DocumentType = 
  | 'national_id' 
  | 'residence_proof' 
  | 'tax_certificate' 
  | 'bank_statement' 
  | 'other';

export type DocumentStatus = 
  | 'pending' 
  | 'verified' 
  | 'rejected';

export type PayoutAccountStatus = 
  | 'pending' 
  | 'verified' 
  | 'rejected';

export type AccountType = 
  | 'individual' 
  | 'corporate';

export interface Application {
  id: string;
  user_id: string;
  
  first_name: string;
  last_name: string;
  birth_date?: string;
  national_id?: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  address: string;
  hometown?: string;
  
  company_type?: CompanyType;
  company_name?: string;
  tax_number?: string;
  company_address?: string;
  website?: string;
  
  instagram_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  linkedin_url?: string;
  
  application_purpose: ApplicationPurpose;
  category_tags: string[];
  
  status: ApplicationStatus;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  
  kvkk_accepted: boolean;
  privacy_accepted: boolean;
  terms_accepted: boolean;
  signature_name?: string;
  signature_date?: string;
  
  created_at: string;
  updated_at: string;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  type: DocumentType;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  checksum?: string;
  status: DocumentStatus;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface PayoutAccount {
  id: string;
  application_id: string;
  user_id: string;
  
  iban: string;
  account_type: AccountType;
  account_holder_name: string;
  
  iban_format_valid: boolean;
  name_match_score?: number;
  name_mismatch: boolean;
  
  status: PayoutAccountStatus;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  
  created_at: string;
  updated_at: string;
}

export interface ApplicationMessage {
  id: string;
  application_id: string;
  sender_id: string;
  message: string;
  is_admin: boolean;
  translated_message: Record<string, string>;
  read_at?: string;
  created_at: string;
}

export interface ApplicationTimeline {
  id: string;
  application_id: string;
  event_type: string;
  old_status?: ApplicationStatus;
  new_status?: ApplicationStatus;
  actor_id?: string;
  notes?: string;
  created_at: string;
}

export interface ApplicationFormData {
  first_name: string;
  last_name: string;
  birth_date?: string;
  national_id?: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  address: string;
  hometown?: string;
  
  company_type?: CompanyType;
  company_name?: string;
  tax_number?: string;
  company_address?: string;
  website?: string;
  
  instagram_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  linkedin_url?: string;
  
  application_purpose: ApplicationPurpose;
  category_tags: string[];
  
  kvkk_accepted: boolean;
  privacy_accepted: boolean;
  terms_accepted: boolean;
  signature_name: string;
}

export interface IBANValidationResult {
  valid: boolean;
  country?: string;
  checksum_valid: boolean;
  name_match?: number;
  name_mismatch: boolean;
  error?: string;
}

export interface ApplicationStats {
  total: number;
  draft: number;
  submitted: number;
  in_review: number;
  info_requested: number;
  approved: number;
  rejected: number;
}
