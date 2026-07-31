const fs = require("fs");
const os = require("os");
const path = require("path");

function getLocalUploadRoot() {
  if (process.env.LOCAL_UPLOAD_ROOT) return process.env.LOCAL_UPLOAD_ROOT;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    return path.join(os.tmpdir(), "digi-menu", "uploads");
  }
  return path.join(__dirname, "..", "uploads");
}

function ensureLocalUploadDirs() {
  const root = getLocalUploadRoot();
  const menuItemsDir = path.join(root, "menu-items");
  const restaurantAssetsDir = path.join(root, "restaurant-assets");
  fs.mkdirSync(menuItemsDir, { recursive: true });
  fs.mkdirSync(restaurantAssetsDir, { recursive: true });
  return { root, menuItemsDir, restaurantAssetsDir };
}

module.exports = { ensureLocalUploadDirs, getLocalUploadRoot };
