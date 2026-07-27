const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const uploadRoot = path.join(__dirname, "..", "uploads");
const menuUploadDir = path.join(uploadRoot, "menu-items");

fs.mkdirSync(menuUploadDir, { recursive: true });

function getBaseUrl(req) {
  return (process.env.BACKEND_BASE_URL || process.env.API_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
}

const storage = multer.diskStorage({
  destination: menuUploadDir,
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

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
      cb(new Error("Only JPG, PNG, WebP, and GIF images are allowed"));
      return;
    }
    cb(null, true);
  },
});

router.post("/menu-items", requireAuth, (req, res) => {
  upload.single("image")(req, res, (error) => {
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
    });
  });
});

module.exports = router;
