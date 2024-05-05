import express from "express";
import multer from "multer";
import {
  getProfile,
  getBanner,
  getPostImage,
  updateBanner,
} from "../controllers/image.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets/banner");
  },
  filename: function (req, file, cb) {
    cb(null, req.user.id + ".png");
  },
});

const uploadBanner = multer({ storage: storage });

router.post(
  "/banner",
  verifyToken,
  uploadBanner.single("banner"),
  updateBanner
);

router.get("/profile/:id", getProfile);
router.get("/banner/:id", getBanner);
router.get("/post/:id", getPostImage);

export default router;
