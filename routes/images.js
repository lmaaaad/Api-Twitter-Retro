import express from "express";
import { getProfile, getBanner, getPostImage } from "../controllers/image.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile/:tag", getProfile);
router.get("/banner/:tag", getBanner);
router.get("/post/:id/:number", getPostImage);

export default router;
