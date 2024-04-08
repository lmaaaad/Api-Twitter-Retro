import express from "express";
import multer from "multer";
import {
  createTweet,
  getAllTweets,
  getTweetById,
  updateTweet,
  deleteTweet,
  likeTweet,
  unlikeTweet,
  retweetTweet,
  unretweetTweet

} from "../controllers/tweets.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets/post");
  },
  filename: function (req, file, cb) {
    console.log("ITSWORK");
    cb(null, req.body.tag);
  },
});

const postStorage = multer({ storage: storage });

// CREATE TWEET
router.post("/", postStorage.single("image"), createTweet);
router.delete("/:id", verifyToken, deleteTweet);

// GET Tweet
router.get("/", verifyToken, getAllTweets);
router.get("/:id", verifyToken, getTweetById);

// UPDATE
router.patch("/:tweetId", verifyToken, updateTweet);

// Like Tweet 
router.post('/:tweetId/like', verifyToken, likeTweet);
// Unlike tweet 
router.post('/:tweetId/unlike', verifyToken, unlikeTweet);

// Route to retweet a tweet
router.post('/:tweetId/retweet',verifyToken, retweetTweet);

// Route to unretweet a tweet
router.post('/:tweetId/unretweet',verifyToken, unretweetTweet);

export default router;
