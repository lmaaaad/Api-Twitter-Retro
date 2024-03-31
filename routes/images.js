import express from "express";
import Router from "express";
import { getProfile, getBanner, getPostImages } from "../controllers/image.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile/:tag", verifyToken, getProfile);
router.get("/banner/:id", verifyToken, getBanner);
router.get("/post/:id", verifyToken, getPostImages);

export default router;
