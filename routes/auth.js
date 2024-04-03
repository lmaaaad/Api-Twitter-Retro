import express from "express";
import Router from "express";

import {
  requestPasswordReset,
  resetPassword,
  login,
  logout,
  checkEmail,
  checkTag,
  register,
} from "../controllers/auth.js";
import multer from "multer";

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets/profile");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

const upload = multer({ storage: storage });
/* ROUTES WITH FILES */
router.post("/register", upload.single("avatar"), register);

/* ROUTES WITHOUT FILES */
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

router.post("/login", login);

router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);
router.post("/login", login);
router.post("/check-email/", checkEmail);
router.post("/check-tag/", checkTag);

export default router;
