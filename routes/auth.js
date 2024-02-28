import express from "express";
import Router from "express";

import { login } from "../controllers/auth.js";

const router = express.Router();
router.post("/login", login);

export default router;
