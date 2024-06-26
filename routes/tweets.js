import express from "express";
import multer from "multer";
import {
  createTweet,
  getAllTweets,
  getTweetById,
  getTweetsPerIds,
  deleteTweet,
  likeTweet,
  unlikeTweet,
  retweetTweet,
  unretweetTweet,
  bookmarkTweet,
  unbookmarkTweet,
  searchLatest,
  getComments,
  getFeedTrendy,
  searchByHashtag,
  getTopHashtags,
} from "../controllers/tweets.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/assets/post");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const postUpload = multer({ storage: storage });

router.get("/feedTrendy", verifyToken, getFeedTrendy);
router.get("/topHashtags", verifyToken, getTopHashtags);
router.get("/feed", verifyToken, getAllTweets);
router.get("/:id", verifyToken, getTweetById);

router.post("/", verifyToken, postUpload.single("image"), createTweet);
router.delete("/:id", verifyToken, deleteTweet);

router.get("/", verifyToken, getTweetsPerIds);
router.get("/searchByHashtag/:hashtag", searchByHashtag);

router.post("/:tweetId/like", verifyToken, likeTweet);
router.post("/:tweetId/unlike", verifyToken, unlikeTweet);
router.post("/:tweetId/retweet", verifyToken, retweetTweet);
router.post("/:tweetId/unretweet", verifyToken, unretweetTweet);
router.post("/:tweetId/bookmark", verifyToken, bookmarkTweet);
router.post("/:tweetId/unbookmark", verifyToken, unbookmarkTweet);
router.get("/:tweetId/comment", verifyToken, getComments);

router.get("/latest/:search", verifyToken, searchLatest);

export default router;
