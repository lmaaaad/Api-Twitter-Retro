import express from "express";
import Router from "express";

import { login } from "../controllers/auth.js";
import { requestPasswordReset, resetPassword } from "../controllers/auth.js";

const router = express.Router();

router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

router.post("/login", login);

export default router;
