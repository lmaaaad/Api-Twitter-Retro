
import express from "express";
import Router from "express";
import {
    postTweet,
    getAllTweets,
    getTweetById,
    updateTweet,
    deleteTweet
    
} from "../controllers/tweets.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// CREATE TWEET
router.post("/", verifyToken, postTweet); 

/*  READ */

router.get("/", verifyToken, getAllTweets);
router.get("/:tweetId", verifyToken, getTweetById);


// UPDATE 

router.patch("/:tweetId", verifyToken, updateTweet);

/* DELETE */ 

router.delete("/:tweetId", verifyToken, deleteTweet);

export default router;