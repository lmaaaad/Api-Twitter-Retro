import Tweet from "../models/tweet.js";
import User from "../models/user.js";
import Hashtag from "../models/hashtag.js";

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
export const getFeed = async(req, res) => {
  try {
    // Get the current user's ID 
    const currentUserId = req.user.id;

    // Retrieve the list of users that the current user is following
    const currentUser = await User.findById(currentUserId).populate("following");
    const followedUserIds = currentUser.following.map(user => user._id);

    // Retrieve tweets authored by followed users
    const followedUserTweets = await Tweet.find({ author: { $in: followedUserIds } })
      .sort({ createdAt: -1 })
      .populate("author");

    // // Retrieve popular hashtags
    // const popularHashtags = await Hashtag.find({}).sort({ count: -1 }).limit(10); // Adjust limit as needed

    // // Retrieve tweets containing popular hashtags
    // const popularHashtagTweets = await Tweet.find({ hashtags: { $in: popularHashtags.map(hashtag => hashtag.text) } })
    //   .sort({ createdAt: -1 })
    //   .populate("author");

    // // Combine followed user tweets and popular hashtag tweets
    // const combinedFeed = [...followedUserTweets, ...popularHashtagTweets];

    // // Sort combined feed by timestamp
    // combinedFeed.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json(followedUserTweets);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }

};

export const getFeedTrendy = async(req, res) => {
  try {
    // Get the current user's ID 
    const currentUserId = req.user.id;

    // Retrieve the list of users that the current user is following
    const currentUser = await User.findById(currentUserId).populate("following");
    const followedUserIds = currentUser.following.map(user => user._id);

    // Retrieve tweets authored by followed users
    const followedUserTweets = await Tweet.find({ author: { $in: followedUserIds } })
      .sort({ createdAt: -1 })
      .populate("author");

    // Retrieve popular hashtags
    const popularHashtags = await Hashtag.find({}).sort({ count: -1 }).limit(10); // Adjust limit as needed

    // Retrieve tweets containing popular hashtags
    const popularHashtagTweets = await Tweet.find({ hashtags: { $in: popularHashtags.map(hashtag => hashtag.text) } })
      .sort({ createdAt: -1 })
      .populate("author");

    // Combine followed user tweets and popular hashtag tweets
    const combinedFeed = [...followedUserTweets, ...popularHashtagTweets];

    // Sort combined feed by timestamp
    combinedFeed.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json(combinedFeed);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }

};

const extractHashtags = (body) => {
  const regex = /#(\w+)/g;
  const matches = body.match(regex);
  if (matches) {
    return matches.map(match => ({ text: match.substring(1) }));
  } else {
    return [];
  }
};

// Function to update hashtag documents
const updateHashtags = async (hashtags) => {
  try {
    for (const tag of hashtags) {
      // Check if the hashtag already exists in the database
      const existingHashtag = await Hashtag.findOne({ text: tag.text });
      if (existingHashtag) {
        // If the hashtag already exists, increment its count
        existingHashtag.count += 1;
        await existingHashtag.save();
      } else {
        // If the hashtag doesn't exist, create a new document
        const newHashtag = new Hashtag({ text:tag.text, count: 1 });
        await newHashtag.save();
      }
    }
  } catch (error) {
    console.error("Error updating hashtags:", error);
    //throw error; // Propagate the error back to the caller
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
export const searchByHashtag = async (req, res) => {
 
  try {
    const hashtag = req.params.hashtag;
    const page = parseInt(req.query.page) || 1; // Current page number, default to 1
    const pageSize = parseInt(req.query.pageSize) || 10; // Number of posts per page

    // Calculate skip value to paginate results
    const skip = (page - 1) * pageSize;

    // Query database for posts containing the hashtag
    const posts = await Tweet.find({ body: { $regex: `#${hashtag}\\b`, $options: 'i' } })
      .sort({ [`hashtags.${hashtag}`]: -1 })
      .skip(skip) // Skip the specified number of documents
      .limit(pageSize); // Limit the number of posts to the page size

    // Count total number of posts containing the hashtag
    const totalPosts = await Tweet.countDocuments({ body: { $regex: `#${hashtag}\\b`, $options: 'i' } });

    // Calculate total number of pages
    const totalPages = Math.ceil(totalPosts / pageSize);

    // Construct pagination metadata
    const pagination = {
      currentPage: page,
      totalPages: totalPages,
      pageSize: pageSize,
      totalCount: totalPosts,
    };

    // Send response with paginated posts and pagination metadata
    return res.status(200).json({ posts, pagination });
  } catch (error) {
    console.error('Error searching for hashtag:', error);
    return res.status(500).json({ error: 'Internal server error' });
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

    const hashtags = extractHashtags(deletedTweet.body);
    await Promise.all(
      hashtags.map(async (tag) => {
        const existingHashtag = await Hashtag.findOneAndUpdate(
          { text: tag.text },
          { $inc: { count: -1 } },
          { new: true }
        );

        // If the count becomes zero, remove the hashtag from the database
        if (existingHashtag.count === 0) {
          await Hashtag.findOneAndDelete({ text: tag.text });
        }
      })
    );

    res.status(200).json({ userTweets: user.tweets, userStat: user.stat });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const createTweet = async (req, res) => {
  try {
    const { body, type } = req.body;
    const author = req.user.id;
    const hashtags = extractHashtags(body);


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
      try {
        await updateHashtags(hashtags);
      } catch (error) {
        console.error("Error updating hashtags:", error);
      }
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
