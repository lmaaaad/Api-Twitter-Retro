import express from "express";
import { searchUser } from "../controllers/search.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken,searchUser);

export default router;