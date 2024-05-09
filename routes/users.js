import express from "express";
import multer from "multer";
import {
  getUserById,
  getUserByTag,
  updateUser,
  followUser,
  unfollowUser,
  getMe,
  getUsersByIds,
  getSearchUsers,
  getFollowers,
  getFollowing,
  getUserPosts,
  getUserLikes,
  getUserRetweets,
  getUserBookmarks,
  searchUser,
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
router.get("/:tag/followers", verifyToken, getFollowers);
router.get("/:tag/following", verifyToken, getFollowing);
router.post("/:id/following", verifyToken, followUser);
router.delete("/:id/following", verifyToken, unfollowUser);

router.get("/:tag/posts", verifyToken, getUserPosts);
router.get("/:tag/likes", verifyToken, getUserLikes);
router.get("/:tag/retweets", verifyToken, getUserRetweets);
router.get("/:tag/bookmarks", verifyToken, getUserBookmarks);

/* USER */
router.get("/me", verifyToken, getMe);
router.get("/:id", verifyToken, getUserById);
router.get("/", getUsersByIds);
router.get("/by/tag/:tag", verifyToken, getUserByTag);
router.get("/search/:search", getSearchUsers);
router.patch("/", verifyToken, profileUpload.single("profile"), updateUser);

router.get("/group", verifyToken, searchUser);

export default router;
