# GitLab Proje Kurulum Adımları

## 🚀 GitLab'da Proje Oluşturma

### **1. GitLab'da "Create blank project" Seçin**

#### **Proje Bilgileri:**
- **Project Name:** `lumi-video-chat`
- **Project URL:** `https://gitlab.com/sonertoprak/lumi-video-chat`
- **Visibility:** Private (önerilen)

### **2. Proje Oluşturduktan Sonra:**

#### **A. Mevcut Kodu GitLab'a Push Edin:**
```bash
# GitLab remote ekleyin
git remote add gitlab https://gitlab.com/sonertoprak/lumi-video-chat.git

# Kodu push edin
git push gitlab main
```

#### **B. CI/CD Variables Ayarlayın:**
GitLab projenizde **Settings > CI/CD > Variables** bölümüne gidin:

```
EXPO_TOKEN = Zokxk54AltTsYyKdfUNu6UzwwEZ8da0d8y_KAk6E
EAS_PROJECT_ID = b70e3082-d2b5-47a5-ad2e-0148889c48e8
SUPABASE_URL = your_supabase_url_here
SUPABASE_ANON_KEY = your_supabase_anon_key_here
STRIPE_SECRET_KEY = your_stripe_secret_key_here
GITHUB_TOKEN = your_github_token_here
```

#### **C. Google Play Service Account JSON:**
- **Key:** `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
- **Type:** File
- **Value:** JSON dosyasının içeriği

### **3. Pipeline Test Edin:**

#### **Development Build:**
```bash
git checkout -b develop
git push gitlab develop
```

#### **Preview Build:**
```bash
git push gitlab main
```

#### **Production Build:**
```bash
git tag v1.0.0
git push gitlab v1.0.0
```

### **4. Build Sonuçları:**

- **Development:** APK dosyası (1 hafta)
- **Preview:** APK dosyası (1 hafta)
- **Production:** AAB dosyası (1 ay)

### **5. Troubleshooting:**

#### **Eğer Pipeline Başarısız Olursa:**
1. Variables'ları kontrol edin
2. Build log'larını inceleyin
3. Token'ların doğru olduğundan emin olun

#### **Eğer Build Başarısız Olursa:**
1. EAS project ID'yi kontrol edin
2. Expo token'ı kontrol edin
3. Google Play credentials'ları kontrol edin

## ✅ Başarılı Kurulum Sonrası:

- ✅ GitLab projesi oluşturuldu
- ✅ Kod import edildi
- ✅ CI/CD variables ayarlandı
- ✅ Pipeline çalışıyor
- ✅ Build'ler başarılı

## 🎯 Sonraki Adımlar:

1. **Proje oluşturun** - "Create blank project"
2. **Kodu import edin** - Git push
3. **Variables ayarlayın** - CI/CD settings
4. **Pipeline test edin** - Build çalıştırın
5. **Production deploy** - Google Play Store
