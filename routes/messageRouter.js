import express from "express";
import {
  allMessages,
  sendMessage,
} from "../controllers/messageController.js";
import { verifyToken } from "../middleware/auth.js";
const router = express.Router();

router.route("/:chatId").get(verifyToken, allMessages);
router.route("/").post(verifyToken, sendMessage);

export default router;