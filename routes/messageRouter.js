import express from "express";
import {
  allMessages,
  sendMessage,
} from "../controllers/messageController.js";
import { verifyToken } from "../middleware/auth.js";
const router = express.Router();

// Route for getting all messages in a chat
router.get("/:chatId", verifyToken, allMessages);

// Route for sending a message
router.post("/", verifyToken, sendMessage);


export default router;