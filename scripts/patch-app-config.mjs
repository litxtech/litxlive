import fs from "fs";

const APP_JSON = "app.json";
const EAS_JSON = "eas.json";

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
}

if (!fs.existsSync(APP_JSON)) {
  throw new Error("app.json bulunamadı (repo kökünde olmalı).");
}

const app = readJson(APP_JSON);

// Güvenli alanları hazırla
app.expo = app.expo || {};
app.expo.ios = app.expo.ios || {};
app.expo.android = app.expo.android || {};
app.expo.plugins = app.expo.plugins || [];
app.expo.experiments = app.expo.experiments || {};
app.expo.extra = app.expo.extra || {};

// Zorunlu düzeltmeler
app.expo.name = "Lumi Live";
app.expo.slug = app.expo.slug || "lumi-live";

// iOS bundle id
app.expo.ios.bundleIdentifier = "com.litxtech.lumi";

// Android package (applicationId)
app.expo.android.package = "com.litxtech.lumi";

// Adaptive icon defaults
app.expo.android.adaptiveIcon = app.expo.android.adaptiveIcon || {
  foregroundImage: "./assets/images/adaptive-icon.png",
  backgroundColor: "#ffffff",
};

// Depreke/mükerrer izinleri temizle (READ/WRITE_EXTERNAL_STORAGE vb.)
if (Array.isArray(app.expo.android.permissions)) {
  const bad = new Set([
    "READ_EXTERNAL_STORAGE",
    "WRITE_EXTERNAL_STORAGE",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE",
  ]);
  app.expo.android.permissions = app.expo.android.permissions.filter(
    (p) => !bad.has(p)
  );
}

// Hatalı serbest manifest bloklarını kaldır (pluginler handle etmeli)
if (app.expo.android.manifest) {
  delete app.expo.android.manifest;
}

// Pluginleri normalize et
if (Array.isArray(app.expo.plugins)) {
  // expo-notifications varlık yollarını temizle
  app.expo.plugins = app.expo.plugins.map((pl) => {
    if (Array.isArray(pl) && pl[0] === "expo-notifications") {
      const cfg = Object.assign({}, pl[1] || {});
      delete cfg.icon;
      delete cfg.sounds;
      return ["expo-notifications", cfg];
    }
    return pl;
  });
  // expo-router'ı eklenmezse ekle (zorunlu)
  const hasRouter = app.expo.plugins.some((pl) => {
    const name = Array.isArray(pl) ? pl[0] : pl;
    return name === "expo-router";
  });
  if (!hasRouter) {
    app.expo.plugins.unshift("expo-router");
  }
}

// Experiments
app.expo.experiments.typedRoutes = true;

// Owner ve EAS projectId korunur/dokunulmaz; yoksa ekle
app.expo.owner = app.expo.owner || "litxtechltd";
app.expo.extra.eas = app.expo.extra.eas || {
  projectId: "ebc53d02-6564-4eeb-855d-5f8ab4488fe2",
};

writeJson(APP_JSON, app);

// eas.json oluştur / güncelle
let eas = { cli: { version: ">= 14.0.0" }, build: {}, submit: { production: {} } };
if (fs.existsSync(EAS_JSON)) {
  try {
    eas = readJson(EAS_JSON);
  } catch {}
}
eas.cli = eas.cli || { version: ">= 14.0.0" };
eas.build = eas.build || {};
eas.build.production = eas.build.production || {};
eas.build.production.android = Object.assign(
  { buildType: "app-bundle", autoIncrement: true },
  eas.build.production.android || {}
);
eas.build.production.ios = Object.assign(
  { autoIncrement: true },
  eas.build.production.ios || {}
);
// İsteğe bağlı env nesnesi (CI için kullanılabilir)
if (!eas.build.production.env) eas.build.production.env = {};

writeJson(EAS_JSON, eas);

console.log("✅ app.json ve eas.json başarıyla yamalandı.");
