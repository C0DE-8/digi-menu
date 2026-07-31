const path = require("path");
const { Readable } = require("stream");
const { v2: cloudinary } = require("cloudinary");
const express = require("express");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");
const { getCloudinarySettings, getUploadProvider } = require("../services/system-settings");
const { ensureLocalUploadDirs } = require("../services/upload-storage");

const router = express.Router();
ensureLocalUploadDirs();

function getBaseUrl(req) {
  return (process.env.BACKEND_BASE_URL || process.env.API_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
}

function createLocalStorage(destinationDir, defaultStem) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destinationDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const stem =
        path
          .basename(file.originalname, ext)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 48) || defaultStem;
      cb(null, `${Date.now()}-${stem}${ext}`);
    },
  });
}

function createLocalUpload(destinationDir, defaultStem) {
  return multer({
    storage: createLocalStorage(destinationDir, defaultStem),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter,
  });
}

function localAssetUrl(req, folder, filename) {
  return `${getBaseUrl(req)}/uploads/${folder}/${filename}`;
}

const uploadDirs = ensureLocalUploadDirs();
const menuItemLocalUpload = createLocalUpload(uploadDirs.menuItemsDir, "menu-item");
const restaurantAssetLocalUpload = createLocalUpload(uploadDirs.restaurantAssetsDir, "restaurant-asset");

const memoryStorage = multer.memoryStorage();

function imageFileFilter(_req, file, cb) {
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
    cb(new Error("Only JPG, PNG, WebP, and GIF images are allowed"));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

router.post("/menu-items", requireAuth, async (req, res) => {
  handleImageUpload(req, res, {
    localUpload: menuItemLocalUpload,
    localFolder: "menu-items",
    cloudinaryFolder: "digi-menu/menu-items",
  });
});

router.post("/restaurant-assets/:type", requireAuth, async (req, res) => {
  const type = String(req.params.type || "");
  if (!["logo", "cover"].includes(type)) {
    res.status(400).json({ message: "Upload type must be logo or cover" });
    return;
  }

  handleImageUpload(req, res, {
    localUpload: restaurantAssetLocalUpload,
    localFolder: "restaurant-assets",
    cloudinaryFolder: `digi-menu/restaurants/${type}`,
  });
});

async function handleImageUpload(req, res, options) {
  let provider = "cloudinary";
  try {
    provider = await getUploadProvider();
  } catch (error) {
    res.status(500).json({ message: error.message || "Could not read upload settings" });
    return;
  }
  if (provider === "local") {
    uploadLocal(req, res, options);
    return;
  }

  upload.single("image")(req, res, (error) => {
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Image file is required" });
      return;
    }

    uploadCloudinary(req.file, options.cloudinaryFolder)
      .then((result) => {
        res.status(201).json({
          image_url: result.secure_url,
          provider: "cloudinary",
          public_id: result.public_id,
        });
      })
      .catch((uploadError) => {
        res.status(500).json({ message: uploadError.message || "Cloudinary upload failed" });
      });
  });
}

function uploadLocal(req, res, options) {
  options.localUpload.single("image")(req, res, (error) => {
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Image file is required" });
      return;
    }

    const pathUrl = `/uploads/${options.localFolder}/${req.file.filename}`;
    res.status(201).json({
      image_url: localAssetUrl(req, options.localFolder, req.file.filename),
      path: pathUrl,
      filename: req.file.filename,
      provider: "local",
    });
  });
}

async function uploadCloudinary(file, folder) {
  const settings = await getCloudinarySettings();
  return new Promise((resolve, reject) => {
    if (!settings.cloudName || !settings.apiKey || !settings.apiSecret) {
      reject(new Error("Cloudinary is selected, but Cloudinary credentials are missing"));
      return;
    }

    cloudinary.config({
      cloud_name: settings.cloudName,
      api_key: settings.apiKey,
      api_secret: settings.apiSecret,
      secure: true,
    });

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder || settings.folder || "digi-menu/menu-items",
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });
}

module.exports = router;
