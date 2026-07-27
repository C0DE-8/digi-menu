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

const localStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ensureLocalUploadDirs().menuItemsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const stem =
      path
        .basename(file.originalname, ext)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48) || "menu-item";
    cb(null, `${Date.now()}-${stem}${ext}`);
  },
});

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

const localUpload = multer({
  storage: localStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

router.post("/menu-items", requireAuth, async (req, res) => {
  let provider = "cloudinary";
  try {
    provider = await getUploadProvider();
  } catch (error) {
    res.status(500).json({ message: error.message || "Could not read upload settings" });
    return;
  }
  if (provider === "local") {
    uploadLocal(req, res);
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

    uploadCloudinary(req.file)
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
});

function uploadLocal(req, res) {
  localUpload.single("image")(req, res, (error) => {
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Image file is required" });
      return;
    }

    const pathUrl = `/uploads/menu-items/${req.file.filename}`;
    res.status(201).json({
      image_url: `${getBaseUrl(req)}${pathUrl}`,
      path: pathUrl,
      filename: req.file.filename,
      provider: "local",
    });
  });
}

async function uploadCloudinary(file) {
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
        folder: settings.folder || "digi-menu/menu-items",
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
