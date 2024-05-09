import express from "express";

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

router.post("/register", register);

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
