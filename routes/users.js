import express from "express";
import Router from "express";
import {
  getUserById,
  //getUserByUsername,
 // getUserFriends,
  updateUser,
  followUser,
  unfollowUser,
  getMe,
  getUsersById,
} from "../controllers/users.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* USER */
router.get("/me", verifyToken, getMe);
router.get("/:id", verifyToken, getUserById);
router.get("/", getUsersById);
//router.get("/by/username/:username", verifyToken, getUserByUsername); // GET User per username
router.patch("/:id", verifyToken, updateUser);

/* FOLLOWERS */
//router.get("/:id/followers", verifyToken, getUserFriends);
//router.get("/users/:id/followers", verifyToken, xxx); // Users a user ID is following
router.post("/:id/following", verifyToken, followUser);
router.delete(
  "/:source_user_id/following/:target_user_id",
  verifyToken,
  unfollowUser
); // Unfollow routes, {source_user_id} is the authenticating user and {target_user_id} the user to unfollow

export default router;
