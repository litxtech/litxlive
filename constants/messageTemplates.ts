export const MESSAGE_TEMPLATES = {
  brand_name: "LITX Live",
  support_email: "support@litxtech.com",
  defaults: {
    otp_ttl_minutes: 5,
    otp_max_attempts: 3,
    otp_rate_limit_seconds: 60,
    lock_minutes_on_fail: 5,
    welcome_bonus_coins: 100
  },
  templates: {
    sms: {
      OTP_SEND_EN: "{{brand_name}}: Your verification code is {{otp_code}}. Valid for 5 minutes. Do not share.",
      OTP_SEND_TR: "{{brand_name}}: Dogrulama kodun: {{otp_code}}. 5 dk gecerli. Kodu kimseyle paylasma.",
      OTP_SUCCESS_EN: "{{brand_name}}: Phone verified. You can continue to your account.",
      OTP_SUCCESS_TR: "{{brand_name}}: Telefon dogrulandi. Hesabina devam edebilirsin.",
      OTP_EXPIRED_EN: "{{brand_name}}: Code expired. Request a new code.",
      OTP_EXPIRED_TR: "{{brand_name}}: Kodun suresi doldu. Yeniden kod iste.",
      OTP_INVALID_EN: "{{brand_name}}: Invalid code. Try again.",
      OTP_INVALID_TR: "{{brand_name}}: Gecersiz kod. Tekrar dene.",
      RATE_LIMIT_EN: "{{brand_name}}: Too many requests. Try again in 60 seconds.",
      RATE_LIMIT_TR: "{{brand_name}}: Cok sik istek. 60 sn sonra tekrar dene.",
      LOCK_EN: "{{brand_name}}: Security lock. Try again in 5 minutes.",
      LOCK_TR: "{{brand_name}}: Guvenlik kilidi. 5 dk sonra tekrar dene.",
      WELCOME_EN: "{{brand_name}}: Registration complete. {{bonus_coins}} coins gift! Profile: {{app_url}}",
      WELCOME_TR: "{{brand_name}}: Kaydin tamam. {{bonus_coins}} coin hediye! Profil: {{app_url}}"
    },
    email: {
      EMAIL_VERIFY_SUBJ_EN: "Verify your email — {{brand_name}}",
      EMAIL_VERIFY_SUBJ_TR: "E-postanı doğrula — {{brand_name}}",
      EMAIL_VERIFY_BODY_EN: "Hi {{first_name}},\n\nYour email verification code is: {{otp_code}} (valid for 5 minutes).\n\nVerification page: {{verify_url}}\n\n— {{brand_name}} Support ({{support_email}})",
      EMAIL_VERIFY_BODY_TR: "Merhaba {{first_name}},\n\nE-posta dogrulama kodun: {{otp_code}} (5 dk gecerli).\n\nDogrulama sayfası: {{verify_url}}\n\n— {{brand_name}} Destek ({{support_email}})",
      EMAIL_VERIFIED_SUBJ_EN: "Email verified — welcome",
      EMAIL_VERIFIED_SUBJ_TR: "E-posta doğrulandı — hoş geldin",
      EMAIL_VERIFIED_BODY_EN: "Hi {{first_name}},\n\nYour email has been verified. Continue here: {{app_url}}",
      EMAIL_VERIFIED_BODY_TR: "Merhaba {{first_name}},\n\nE-postan dogrulandi. Devam etmek icin: {{app_url}}",
      WELCOME_SUBJ_EN: "Welcome to {{brand_name}} 🎉",
      WELCOME_SUBJ_TR: "{{brand_name}}'e hoş geldin 🎉",
      WELCOME_BODY_EN: "Hi {{first_name}},\n\nYour account has been created. Complete your profile and get {{bonus_coins}} bonus coins: {{app_url}}\n\nIf you have any issues: {{support_email}}",
      WELCOME_BODY_TR: "Merhaba {{first_name}},\n\nHesabin olusturuldu. Profilini tamamla ve bonus {{bonus_coins}} coin kazan: {{app_url}}\n\nSorun olursa: {{support_email}}"
    },
    google: {
      START_EN: "Signing in with Google... Don't close the window.",
      START_TR: "Google ile giris yapiliyor… Pencereyi kapatma.",
      SUCCESS_EN: "Google account verified. Proceeding to required profile steps.",
      SUCCESS_TR: "Google hesabin dogrulandi. Zorunlu profil adimlarina geciyoruz.",
      CANCELLED_EN: "Google sign-in cancelled. Try again or continue with email.",
      CANCELLED_TR: "Google girisi iptal edildi. Tekrar dene veya e-posta ile devam et.",
      CONFLICT_EN: "This Google account is linked to a different registration. Try with the correct Google account.",
      CONFLICT_TR: "Bu Google hesabi farkli bir kayitla iliskili. Dogru Google hesabi ile tekrar dene.",
      CALLBACK_ERROR_EN: "Google connection could not be completed (callback error). Try again in a minute.",
      CALLBACK_ERROR_TR: "Google baglantisi tamamlanamadi (callback hatasi). Bir dakika sonra yeniden dene.",
      NETWORK_EN: "Cannot reach network. Check your internet connection and try again.",
      NETWORK_TR: "Aga ulasilamiyor. Internet baglantini kontrol et ve tekrar dene.",
      RATE_LIMIT_EN: "Too many attempts. Try again in 60 seconds.",
      RATE_LIMIT_TR: "Cok sik deneme. 60 sn sonra tekrar dene."
    },
    errors: {
      otp_invalid: "Invalid code.",
      otp_expired: "Code expired. Request a new code.",
      otp_rate_limited: "Too many requests. Try again in 60 seconds.",
      otp_locked: "3 failed attempts. Locked for 5 minutes.",
      email_in_use: "This email is already registered. Try signing in.",
      phone_in_use: "This phone number is registered. Try signing in.",
      network_failed: "Network error. Check your connection.",
      server_error: "Unexpected error. Try again later.",
      google_cancelled: "Google sign-in cancelled.",
      google_conflict: "This Google account is linked to a different registration.",
      verify_required: "Verification required to continue."
    }
  }
};

export function formatTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}
