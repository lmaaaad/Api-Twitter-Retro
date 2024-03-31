import express from "express";
import Router from "express";
import {
  createTweet,
  getAllTweets,
  getTweetById,
  updateTweet,
  deleteTweet,
} from "../controllers/tweets.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// CREATE TWEET
router.post("/", verifyToken, createTweet);
router.delete("/:id", verifyToken, deleteTweet);

// GET Tweet
router.get("/", verifyToken, getAllTweets);
router.get("/:id", verifyToken, getTweetById);

// UPDATE
router.patch("/:tweetId", verifyToken, updateTweet);

export default router;
