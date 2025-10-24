# GitLab CI/CD Variables Listesi

## 🔧 GitLab'da Ayarlanacak Variables

### **1. Expo/EAS Variables:**
```
EXPO_TOKEN = your_expo_token_here
EAS_PROJECT_ID = ebc53d02-6564-4eeb-855d-5f8ab4488fe2
```

### **2. Supabase Variables:**
```
SUPABASE_URL = your_supabase_url_here
SUPABASE_ANON_KEY = your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY = your_supabase_service_role_key_here
```

### **3. Database Variables:**
```
DATABASE_URL = your_database_url_here
```

### **4. Stripe Variables:**
```
STRIPE_PUBLISHABLE_KEY = your_stripe_publishable_key_here
STRIPE_SECRET_KEY = your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET = your_stripe_webhook_secret_here
```

### **5. Agora Variables:**
```
AGORA_APP_ID = your_agora_app_id_here
AGORA_APP_CERTIFICATE = your_agora_app_certificate_here
```

### **6. GitHub Variables:**
```
GITHUB_TOKEN = your_github_token_here
```

### **7. Google Play Store Variables:**
```
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = (File type - JSON content)
```

### **8. Build Variables:**
```
NODE_ENV = production
EXPO_PUBLIC_APP_ENV = production
```

## 📋 Variables Ayarlama Adımları:

1. **GitLab projenizde** → **Settings** → **CI/CD** → **Variables**
2. **Add variable** butonuna tıklayın
3. **Key** ve **Value** alanlarını doldurun
4. **Protected** ve **Masked** seçeneklerini ayarlayın
5. **Add variable** butonuna tıklayın

## 🔒 Güvenlik Ayarları:

- **Protected:** Sadece protected branch'lerde kullanılabilir
- **Masked:** Log'larda görünmez
- **File:** JSON dosyaları için kullanın

## ✅ Test Etmek İçin:

1. Tüm variables'ları ekleyin
2. Pipeline'ı çalıştırın
3. Build log'larını kontrol edin
4. Artifacts'ları indirin

## 🚀 Pipeline Tetikleme:

- **Development:** `develop` branch'e push
- **Preview:** `main` branch'e push  
- **Production:** Git tag oluşturun
