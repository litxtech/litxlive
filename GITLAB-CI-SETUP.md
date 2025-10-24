# GitLab CI/CD Setup Guide

## 🔧 GitLab CI/CD Pipeline Kurulumu

### **1. GitLab CI/CD Variables Ayarlayın:**

GitLab projenizde **Settings > CI/CD > Variables** bölümüne gidin ve şu değişkenleri ekleyin:

#### **Expo/EAS Variables:**
```
EXPO_TOKEN = your_expo_token_here
EAS_PROJECT_ID = ebc53d02-6564-4eeb-855d-5f8ab4488fe2
```

#### **Supabase Variables:**
```
SUPABASE_URL = your_supabase_url_here
SUPABASE_ANON_KEY = your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY = your_supabase_service_role_key_here
```

#### **Database Variables:**
```
DATABASE_URL = your_database_url_here
```

#### **Stripe Variables:**
```
STRIPE_PUBLISHABLE_KEY = your_stripe_publishable_key_here
STRIPE_SECRET_KEY = your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET = your_stripe_webhook_secret_here
```

#### **Agora Variables:**
```
AGORA_APP_ID = your_agora_app_id_here
AGORA_APP_CERTIFICATE = your_agora_app_certificate_here
```

#### **GitHub Variables:**
```
GITHUB_TOKEN = your_github_token_here
```

### **2. Google Play Service Account JSON:**

1. Google Play Console'da **Setup > API access** bölümüne gidin
2. **Service account** oluşturun
3. JSON dosyasını indirin
4. GitLab'da **CI/CD Variables** bölümüne ekleyin:
   - **Key:** `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
   - **Value:** JSON dosyasının içeriği
   - **Type:** File

### **3. Pipeline Stages:**

#### **Development Build:**
- Trigger: `develop` branch
- Output: APK file
- Artifacts: 1 week

#### **Preview Build:**
- Trigger: `main` branch
- Output: APK file
- Artifacts: 1 week

#### **Production Build:**
- Trigger: Git tags
- Output: AAB file (Google Play Store)
- Artifacts: 1 month

#### **Deploy:**
- **Internal Testing:** Manual trigger from `main`
- **Production:** Manual trigger from tags

### **4. Build Commands:**

```bash
# Development
eas build --platform android --profile development --non-interactive

# Preview
eas build --platform android --profile preview --non-interactive

# Production
eas build --platform android --profile production --non-interactive

# Deploy to Google Play
eas submit --platform android --latest
```

### **5. GitLab Runner Requirements:**

- **Node.js 18+**
- **Docker support**
- **Sufficient disk space** (5GB+)
- **Internet connection** for EAS builds

### **6. Pipeline Triggers:**

#### **Automatic:**
- Push to `develop` → Development build
- Push to `main` → Preview build
- Create tag → Production build

#### **Manual:**
- Deploy to internal testing
- Deploy to production

### **7. Artifacts:**

- **APK files** for testing
- **AAB files** for Google Play Store
- **Build logs** for debugging

### **8. Security:**

- All sensitive data in GitLab Variables
- Service account JSON as file variable
- Environment-specific configurations
- Secure token management

## 🚀 Pipeline Başlatma

1. **Variables'ları ayarlayın**
2. **Service account JSON'u ekleyin**
3. **Pipeline'ı test edin**
4. **Production build'i tetikleyin**

## 📱 Build Sonuçları

- **Development:** Internal testing APK
- **Preview:** Preview APK
- **Production:** Google Play Store AAB

## 🔍 Troubleshooting

### **Common Issues:**
- Missing environment variables
- Invalid service account JSON
- EAS authentication issues
- Build timeout errors

### **Solutions:**
- Check all variables are set
- Verify JSON format
- Re-authenticate EAS CLI
- Increase build timeout
