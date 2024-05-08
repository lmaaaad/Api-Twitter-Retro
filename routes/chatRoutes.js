import express from "express";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  removeFromGroup,
  addToGroup,
  renameGroup,
  leaveGroup
} from "../controllers/chatController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post('/', verifyToken, accessChat);
router.get('/', verifyToken, fetchChats);
router.route("/group").post(verifyToken, createGroupChat);
router.route("/rename").put(verifyToken, renameGroup);
router.route("/groupremove").put(verifyToken, removeFromGroup);
router.route("/groupadd").put(verifyToken, addToGroup);
router.route("/leave").put(verifyToken, leaveGroup);


export default router;
