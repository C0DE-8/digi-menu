const { get, run } = require("../data/database");

const DEFAULT_UPLOAD_PROVIDER = "cloudinary";
const UPLOAD_PROVIDERS = new Set(["cloudinary", "local"]);

async function getSetting(key, fallback = "") {
  const setting = await get("SELECT setting_value FROM system_settings WHERE setting_key = ?", [key]);
  return setting?.setting_value || fallback;
}

async function getUploadProvider() {
  const provider = await getSetting("upload_provider", DEFAULT_UPLOAD_PROVIDER);
  return UPLOAD_PROVIDERS.has(provider) ? provider : DEFAULT_UPLOAD_PROVIDER;
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

module.exports = { DEFAULT_UPLOAD_PROVIDER, UPLOAD_PROVIDERS, getSetting, getUploadProvider, setSetting };
