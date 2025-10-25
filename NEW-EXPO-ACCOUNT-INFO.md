# Yeni Expo Hesap Bilgileri

## 🎯 Yeni Expo Hesap Detayları

### **Hesap Bilgileri:**
- **Username:** `sonertoprak`
- **Password:** `Bavul2017?`
- **Token:** `Zokxk54AltTsYyKdfUNu6UzwwEZ8da0d8y_KAk6E`

### **Yeni EAS Project:**
- **Project Name:** `@sonertoprak/lumi-video-chat`
- **Project ID:** `b70e3082-d2b5-47a5-ad2e-0148889c48e8`
- **URL:** https://expo.dev/accounts/sonertoprak/projects/lumi-video-chat

### **GitLab CI/CD Variables Güncelleme:**

#### **Eski Variables (Değiştirin):**
```
EXPO_TOKEN = Zokxk54AltTsYyKdfUNu6UzwwEZ8da0d8y_KAk6E
EAS_PROJECT_ID = b70e3082-d2b5-47a5-ad2e-0148889c48e8
```

#### **Diğer Variables (Aynı Kalacak):**
```
SUPABASE_URL = your_supabase_url_here
SUPABASE_ANON_KEY = your_supabase_anon_key_here
STRIPE_SECRET_KEY = your_stripe_secret_key_here
GITHUB_TOKEN = your_github_token_here
```

## 🚀 Yapılacaklar:

### **1. GitLab'da Variables Güncelleyin:**
- GitLab projenizde **Settings > CI/CD > Variables**
- `EXPO_TOKEN` değerini güncelleyin: `Zokxk54AltTsYyKdfUNu6UzwwEZ8da0d8y_KAk6E`
- `EAS_PROJECT_ID` değerini güncelleyin: `b70e3082-d2b5-47a5-ad2e-0148889c48e8`

### **2. Test Build Yapın:**
```bash
npx eas build --platform android --profile development --non-interactive
```

### **3. Pipeline Test Edin:**
- GitLab'da pipeline'ı çalıştırın
- Build log'larını kontrol edin
- Artifacts'ları indirin

## ✅ Başarılı Geçiş:

- ✅ Yeni Expo hesabına giriş yapıldı
- ✅ Yeni EAS project oluşturuldu
- ✅ Project ID güncellendi
- ✅ GitLab variables güncellenmeye hazır

## 🔧 Troubleshooting:

### **Eğer Build Başarısız Olursa:**
1. GitLab variables'ları kontrol edin
2. Token'ın doğru olduğundan emin olun
3. Project ID'nin güncel olduğunu kontrol edin
4. Build log'larını inceleyin

### **Eğer Permission Hatası Alırsanız:**
1. Yeni hesabın admin yetkilerini kontrol edin
2. Project ownership'ini kontrol edin
3. Token permissions'ını kontrol edin
