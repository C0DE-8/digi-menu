const { get, run } = require("../data/database");

const DEFAULT_UPLOAD_PROVIDER = "local";
const UPLOAD_PROVIDERS = new Set(["cloudinary", "local"]);
const CLOUDINARY_SETTING_KEYS = {
  cloudName: "cloudinary_cloud_name",
  apiKey: "cloudinary_api_key",
  apiSecret: "cloudinary_api_secret",
  folder: "cloudinary_folder",
};

async function getSetting(key, fallback = "") {
  const setting = await get("SELECT setting_value FROM system_settings WHERE setting_key = ?", [key]);
  return setting?.setting_value || fallback;
}

async function getUploadProvider() {
  const provider = await getSetting("upload_provider", DEFAULT_UPLOAD_PROVIDER);
  return UPLOAD_PROVIDERS.has(provider) ? provider : DEFAULT_UPLOAD_PROVIDER;
}

async function getCloudinarySettings() {
  return {
    cloudName: await getSetting(CLOUDINARY_SETTING_KEYS.cloudName, ""),
    apiKey: await getSetting(CLOUDINARY_SETTING_KEYS.apiKey, ""),
    apiSecret: await getSetting(CLOUDINARY_SETTING_KEYS.apiSecret, ""),
    folder: await getSetting(CLOUDINARY_SETTING_KEYS.folder, "digi-menu/menu-items"),
  };
}

async function getUploadSettings() {
  return {
    uploadProvider: await getUploadProvider(),
    uploadProviders: Array.from(UPLOAD_PROVIDERS),
    cloudinary: await getCloudinarySettings(),
  };
}

async function setCloudinarySettings(settings) {
  const updates = [
    [CLOUDINARY_SETTING_KEYS.cloudName, settings.cloudName],
    [CLOUDINARY_SETTING_KEYS.apiKey, settings.apiKey],
    [CLOUDINARY_SETTING_KEYS.apiSecret, settings.apiSecret],
    [CLOUDINARY_SETTING_KEYS.folder, settings.folder || "digi-menu/menu-items"],
  ];

  for (const [key, value] of updates) {
    await setSetting(key, String(value || ""));
  }

  return getCloudinarySettings();
}

async function setSetting(key, value) {
  await run(
    `INSERT INTO system_settings (setting_key, setting_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
    [key, value]
  );
  return get("SELECT * FROM system_settings WHERE setting_key = ?", [key]);
}

module.exports = {
  DEFAULT_UPLOAD_PROVIDER,
  UPLOAD_PROVIDERS,
  getCloudinarySettings,
  getSetting,
  getUploadProvider,
  getUploadSettings,
  setCloudinarySettings,
  setSetting,
};
