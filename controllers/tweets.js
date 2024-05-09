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
    var tweets = await Tweet.find({ _id: { $in: ids } }).sort({
      createdAt: -1,
    });
    res.status(200).json(tweets);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getTweetById = async (req, res) => {
  try {
    const tweetId = req.params.id;
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

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ error: "Tweet not found" });
    }

    if (tweet.type === "tweet") {
      const deletedTweet = await Tweet.findByIdAndDelete({
        _id: tweetId,
        author: author,
      });

      if (!deletedTweet) {
        return res.status(404).json({ error: "Tweet not found" });
      }

      const userTmp = await User.findById(author);
      const postCount = userTmp.tweets.length;
      const user = await User.findByIdAndUpdate(author, {
        $pull: { tweets: tweetId },
        $set: { "stat.postCount": postCount - 1 },
      });

      return res
        .status(200)
        .json({ userTweets: user.tweets, userStat: user.stat });
    }

    if (tweet.type === "reply") {
      const originalTweet = await Tweet.findById(tweet.originalTweet);

      if (!originalTweet) {
        return res.status(404).json({ error: "Original tweet not found" });
      }

      originalTweet.replies.pull(tweetId);
      originalTweet.stat.comment = originalTweet.replies.length;
      await originalTweet.save();

      const deletedTweet = await Tweet.findByIdAndDelete({
        _id: tweetId,
        author: author,
      });

      if (!deletedTweet) {
        return res.status(404).json({ error: "Tweet not found" });
      }

      const userTmp = await User.findById(author);
      const postCount = userTmp.tweets.length;
      const user = await User.findByIdAndUpdate(author, {
        $pull: { tweets: tweetId },
        $set: { "stat.postCount": postCount - 1 },
      });
      return res
        .status(200)
        .json({ userTweets: user.tweets, userStat: user.stat });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const createTweet = async (req, res) => {
  try {
    const { body, type, replyId } = req.body;
    const author = req.user.id;

    try {
      const originalTweet = replyId;
      var tweet = new Tweet({ body, type, author, originalTweet });
    } catch (error) {
      return res.status(400).json("Bad request Tweet");
    }

    const savedTweet = await tweet.save();

    const tweetId = savedTweet._id;

    const userTmp = await User.findById(author);

    const postCount = userTmp.tweets.length;

    const user = await User.findByIdAndUpdate(author, {
      $push: { tweets: tweetId },
      $set: { "stat.postCount": postCount + 1 },
    });

    if (type === "tweet") {
      if (!req.file) {
        return res.status(201).json({
          userTweets: user.tweets,
          userStat: user.stat,
          tweetId: tweetId,
        });
      }
    }

    if (type === "reply") {
      const tweet = await Tweet.findById(replyId);

      if (tweet) {
        tweet.replies.push(tweetId);
        tweet.stat.comment = tweet.replies.length;
        await tweet.save();
        if (!req.file) {
          return res.status(200).json({ tweet: savedTweet, stat: tweet.stat });
        }
      } else {
        return res.status(404).json({ message: "Tweet non trouvé" });
      }
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
      try {
        updateHashtags(hashtags);
      } catch (error) {
        console.error("Error updating hashtags:", error);
      }
      return res.status(201).json({
        userTweets: user.tweets,
        userStat: user.stat,
        tweetId: tweetId,
      });
    });
  } catch (err) {
    console.error(err.message);
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

export const searchLatest = async (req, res) => {
  const { search } = req.params;

  try {
    const regex = new RegExp(`\\b${search}\\b`, "i");

    const tweets = await Tweet.find({
      body: regex,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    if (!tweets) {
      return res.status(404).json({ message: "Tweet not found" });
    }

    return res.status(200).json(tweets);
  } catch (error) {
    console.error("Error unbookmarking tweet:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getComments = async (req, res) => {
  try {
    const { tweetId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const tweet = await Tweet.findById(tweetId).populate({
      path: "replies",
      populate: {
        path: "author",
        select: "tag fullName",
      },
    });

    if (!tweet) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const startIndex = (page - 1) * pageSize;

    const commentsIds = tweet.replies.reverse();

    const lastCommentsIds = commentsIds.slice(
      startIndex,
      startIndex + pageSize
    );

    res.status(200).json({
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil(tweet.replies.length / pageSize),
      totalItems: tweet.replies.length,
      data: lastCommentsIds,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
