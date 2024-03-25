
import express from "express";
import Router from "express";
import {
    getUser,
    getUserFriends,
    updateUser,
    followUser,
    unfollowUser,
    // addRemoveFriend,
    
} from "../controllers/users.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/*  READ */

router.get("/:id", verifyToken , getUser);
router.get("/:id/followers", verifyToken , getUserFriends);

//UPDATE USER 
router.patch("/:id", verifyToken, updateUser);


// UPDATE follower

// Follow a user by user ID
router.post('/follow/:userId', verifyToken, followUser);

// Unfollow a user by user ID
router.post('/unfollow/:userId', verifyToken, unfollowUser);
//router.patch("/:id/followerId", verifyToken, addRemoveFriends);


export default router;