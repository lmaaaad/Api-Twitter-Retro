import Tweet from "../models/tweet.js";
import User from "../models/user.js";

import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import fs from "fs";

export const getAllTweets = async (req, res) => {
  try {
    // Extract pagination parameters from query string
    const page = parseInt(req.query.page) || 1; // Current page number, default to 1
    const pageSize = parseInt(req.query.pageSize) || 20; // Number of tweets per page

    // Calculate skip value to paginate results
    const skip = (page - 1) * pageSize;

    // Query database for tweets with pagination
    var tweets = await Tweet.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    // Count total number of tweets (for pagination metadata)
    const totalTweets = await Tweet.countDocuments();

    // Calculate total number of pages
    const totalPages = Math.ceil(totalTweets / pageSize);

    // Construct pagination metadata
    const pagination = {
      currentPage: page,
      totalPages: totalPages,
      pageSize: pageSize,
      totalCount: totalTweets,
    };

    // Send response with paginated tweets and pagination metadata
    return res.status(200).json({ tweets, pagination });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getTweetsPerIds = async (req, res) => {
  try {
    const ids = req.query.ids;
    console.log(ids);
    var tweets = await Tweet.find({ _id: { $in: ids } }).sort({
      createdAt: -1,
    });
    console.log(tweets);
    res.status(200).json(tweets);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getTweetById = async (req, res) => {
  try {
    const tweetId = req.params.tweetId;
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      return res.status(404).json({ error: "Tweet not found" });
    }
    res.status(200).json(tweet);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteTweet = async (req, res) => {
  try {
    const tweetId = req.params.id;
    const author = req.user.id;
    const deletedTweet = await Tweet.findByIdAndDelete({
      _id: tweetId,
      author: author,
    });

    const user = await User.findByIdAndUpdate(author, {
      $pull: { tweets: tweetId },
      $inc: { "stat.postCount": -1 },
    });

    if (!deletedTweet) {
      return res.status(404).json({ error: "Tweet not found" });
    }

    res.status(200).json({ userTweets: user.tweets, userStat: user.stat });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const createTweet = async (req, res) => {
  try {
    const { body, type } = req.body;
    const author = req.user.id;

    try {
      var tweet = new Tweet({ body, type, author });
    } catch (error) {
      return res.status(400).json("Bad request Tweet");
    }

    const savedTweet = await tweet.save();

    const tweetId = savedTweet._id;

    const user = await User.findByIdAndUpdate(author, {
      $push: { tweets: tweetId },
      $inc: { "stat.postCount": 1 },
    });

    if (!req.file) {
      return res.status(201).json({
        userTweets: user.tweets,
        userStat: user.stat,
        tweetId: tweetId,
      });
    }

    const tweetIdString = savedTweet._id.toString() + ".png";

    const oldPath = path.join(
      __dirname,
      "..",
      "public",
      "assets",
      "post",
      req.file.originalname
    );
    const newPath = path.join(
      __dirname,
      "..",
      "public",
      "assets",
      "post",
      tweetIdString
    );

    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        console.error("Error rename image (CreateTweets) : ", err);
        return res.status(500).json({ message: err.message });
      }

      const imagePath = "/post/" + tweetIdString + ".png";

      Tweet.findByIdAndUpdate(tweetId, { postImage: imagePath }, { new: true });
      return res.status(201).json({
        userTweets: user.tweets,
        userStat: user.stat,
        tweetId: tweetId,
      });
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};

export const likeTweet = async (req, res) => {
  const { tweetId } = req.params;
  const user = req.user;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: "Tweet not found" });
    }

    if (user.likes.some((like) => like.equals(tweetId))) {
      return res
        .status(400)
        .json({ message: "Tweet already liked by the user" });
    }

    user.likes.push(tweetId);
    user.stat.likeCount++;
    await user.save();

    tweet.stat.like++;
    await tweet.save();

    return res.status(200).json({
      likes: user.likes,
      tweetStat: tweet.stat,
      userStat: user.stat,
    });
  } catch (error) {
    console.error("Error liking tweet:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unlikeTweet = async (req, res) => {
  const { tweetId } = req.params;
  const user = req.user;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: "Tweet not found" });
    }

    const userLikeIndex = user.likes.findIndex((like) => like.equals(tweetId));
    if (userLikeIndex === -1) {
      return res.status(400).json({ message: "Tweet not liked by the user" });
    }

    user.likes.splice(userLikeIndex, 1);
    user.stat.likeCount--;
    await user.save();

    tweet.stat.like--;
    if (tweet.stat.like < 0) {
      tweet.stat.like = 0;
    }
    await tweet.save();

    return res.status(200).json({
      likes: user.likes,
      tweetStat: tweet.stat,
      userStat: user.stat,
    });
  } catch (error) {
    console.error("Error unliking tweet:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const retweetTweet = async (req, res) => {
  const { tweetId } = req.params;
  const user = req.user;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: "Tweet not found" });
    }

    const alreadyRetweetedIndex = user.retweets.findIndex((retweet) =>
      retweet.equals(tweetId)
    );

    if (alreadyRetweetedIndex === -1) {
      // If the user has not retweeted the tweet, add their ID to the retweets array
      user.retweets.push(tweetId);
      user.stat.retweetCount++;
      await user.save();

      tweet.stat.retweet++;
      await tweet.save();
      return res.status(200).json({
        retweets: user.retweets,
        tweetStat: tweet.stat,
        userStat: user.stat,
      });
    } else {
      // If the user has already retweeted the tweet, return an error
      return res
        .status(400)
        .json({ message: "Tweet already retweeted by the user" });
    }
  } catch (error) {
    console.error("Error retweeting tweet:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unretweetTweet = async (req, res) => {
  const { tweetId } = req.params;
  const user = req.user;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: "Tweet not found" });
    }

    // Check if the user has retweeted the tweet
    const alreadyRetweetedIndex = user.retweets.findIndex((retweet) =>
      retweet.equals(tweetId)
    );

    if (alreadyRetweetedIndex !== -1) {
      // If the user has retweeted the tweet, remove their ID from the retweets array
      user.retweets.splice(alreadyRetweetedIndex, 1);
      user.stat.retweetCount--;
      await user.save();

      tweet.stat.retweet--;
      await tweet.save();
      return res.status(200).json({
        retweets: user.retweets,
        tweetStat: tweet.stat,
        userStat: user.stat,
      });
    } else {
      // If the user has not retweeted the tweet, return an error
      return res
        .status(400)
        .json({ message: "Tweet not retweeted by the user" });
    }
  } catch (error) {
    console.error("Error unretweeting tweet:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const bookmarkTweet = async (req, res) => {
  const { tweetId } = req.params;
  const user = req.user;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: "Tweet not found" });
    }

    // Check if the tweet is already bookmarked by the user
    const alreadyBookmarked = user.bookmarks.some((bookmark) =>
      bookmark.equals(tweetId)
    );

    if (alreadyBookmarked) {
      return res
        .status(400)
        .json({ message: "Tweet already bookmarked by the user" });
    }

    user.stat.bookmarkCount++;
    user.bookmarks.push(tweetId);
    await user.save();

    tweet.stat.bookmark++;
    await tweet.save();

    return res.status(200).json({
      bookmarks: user.bookmarks,
      tweetStat: tweet.stat,
      userStat: user.stat,
    });
  } catch (error) {
    console.error("Error bookmarking tweet:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const unbookmarkTweet = async (req, res) => {
  const { tweetId } = req.params;
  const user = req.user;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: "Tweet not found" });
    }

    // Check if the tweet is bookmarked by the user
    const bookmarkIndex = user.bookmarks.findIndex((bookmark) =>
      bookmark.equals(tweetId)
    );

    if (bookmarkIndex === -1) {
      return res
        .status(400)
        .json({ message: "Tweet not bookmarked by the user" });
    }

    user.stat.bookmarkCount--;
    user.bookmarks.splice(bookmarkIndex, 1);
    await user.save();

    tweet.stat.bookmark++;
    await tweet.save();

    return res.status(200).json({
      bookmarks: user.bookmarks,
      tweetStat: tweet.stat,
      userStat: user.stat,
    });
  } catch (error) {
    console.error("Error unbookmarking tweet:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
