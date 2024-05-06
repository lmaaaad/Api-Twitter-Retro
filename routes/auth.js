import express from "express";
import multer from "multer";

import {
  register,
  requestPasswordReset,
  resetPassword,
  login,
  logout,
  checkEmail,
  checkTag,
} from "../controllers/auth.js";

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets/profile");
  },
  filename: function (req, file, cb) {
    // Use the user's ID as the filename
    cb(null, req.userId + ".png"); // Assuming the file extension is png
  },
});
const uploadProfile = multer({ storage: storage }).single("avatar");

router.post("/register",register);

/* ROUTES WITHOUT FILES */
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);
router.post("/login", login);
router.post("/check-email/", checkEmail);
router.post("/check-tag/", checkTag);

router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);
router.post("/login", login);
router.post("/check-email/", checkEmail);
router.post("/check-tag/", checkTag);

export default router;
