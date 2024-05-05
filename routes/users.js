import express from "express";
import multer from "multer";
import {
  getUserById,
  getUserByTag,
  getUserFriends,
  updateUser,
  followUser,
  unfollowUser,
  getMe,
  getUsersByIds,
  addFieldUser,
} from "../controllers/users.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/assets/profile");
  },
  filename: function (req, file, cb) {
    cb(null, req.user.id + ".png");
  },
});

const profileUpload = multer({ storage: profileStorage });

/* FOLLOWERS */
router.get("/:id/followers", verifyToken, getUserFriends);
router.post("/:id/following", verifyToken, followUser);
router.delete("/:id/following", verifyToken, unfollowUser);

/* USER */
router.put("/", verifyToken, addFieldUser);
router.get("/me", verifyToken, getMe);
router.get("/:id", verifyToken, getUserById);
router.get("/", getUsersByIds);
router.get("/by/tag/:tag", verifyToken, getUserByTag);
router.patch("/", verifyToken, profileUpload.single("profile"), updateUser);

export default router;
