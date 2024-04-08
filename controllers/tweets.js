import mongoose from 'mongoose';

import Tweet from "../models/tweet.js";

import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import fs from "fs";

export const createTweet = async (req, res) => {
  try {
    const { body, type, author, tag } = req.body;

    console.log("body: " + body);
    console.log("type: " + type);
    console.log("author: " + author);

    const tweet = new Tweet({ body, type, author });

    const savedTweet = await tweet.save();

    if (!req.file) {
      return res.status(201).json("Tweet created successfully");
    }

    const tweetId = savedTweet._id.toString();

    const oldPath = path.join(__dirname, "public", "assets", "post", tag);
    const newPath = path.join(__dirname, "public", "assets", "post", tweetId);

    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        console.error("Error rename image (CreateTweets) : ", err);
        return res.status(500).json({ message: err.message });
      }

      const imagePath = "/profile/" + tweetId;

      Tweet.findByIdAndUpdate(
        tweetId,
        { postImage: imagePath },
        { new: true },
        (updateErr, updatedTweet) => {
          if (updateErr) {
            console.error("Error updating tweet: ", updateErr);
            return res.status(500).json({ message: updateErr.message });
          }

          return res.status(201).json("Tweet created successfully");
        }
      );
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};

export const getAllTweets = async (req, res) => {
  try {
    // Extract pagination parameters from query string
    const page = parseInt(req.query.page) || 1; // Current page number, default to 1
    const pageSize = parseInt(req.query.pageSize) || 20; // Number of tweets per page

    // Calculate skip value to paginate results
    const skip = (page - 1) * pageSize;

    // Query database for tweets with pagination
    const tweets = await Tweet.find()
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
    res.status(200).json({ tweets, pagination });
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

export const updateTweet = async (req, res) => {
  try {
    const tweetId = req.params.tweetId;
    const updateFields = req.body;
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, updateFields, {
      new: true,
    });
    if (!updatedTweet) {
      return res.status(404).json({ error: "Tweet not found" });
    }
    res.status(200).json(updatedTweet);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteTweet = async (req, res) => {
  try {
    const tweetId = req.params.id;
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
    if (!deletedTweet) {
      return res.status(404).json({ error: "Tweet not found" });
    }
    res.status(200).json({ message: "Tweet deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


export const likeTweet = async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id; // Assuming user ID is available in the request

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Check if the user has already liked the tweet
    if (tweet.likes.some(like => like.equals(userId))) {
      return res.status(400).json({ message: 'Tweet already liked by the user' });
    }

    // Add user ID to the list of likes
    tweet.likes.push(userId);
    await tweet.save();

    res.status(200).json({ message: 'Tweet liked successfully' });
  } catch (error) {
    console.error('Error liking tweet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unlikeTweet = async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id; // Assuming user ID is available in the request

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Check if the user has liked the tweet
    const userLikeIndex = tweet.likes.findIndex(like => like.equals(userId));
    if (userLikeIndex === -1) {
      return res.status(400).json({ message: 'Tweet not liked by the user' });
    }

    // Remove the like from the likes array
    tweet.likes.splice(userLikeIndex, 1);
    await tweet.save();

    // Return the updated tweet object in the response
    return res.status(200).json({ message: 'Tweet unliked successfully' });
  } catch (error) {
    console.error('Error unliking tweet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/*        IF THE USER ALREADY LIKED THE TWEET => UNLIKE THE TWEET , et vice versa 

export const likeTweet = async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id; // Assuming user ID is available in the request

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Check if the user has already liked the tweet
    const alreadyLikedIndex = tweet.likes.findIndex(like => like.equals(userId));

    if (alreadyLikedIndex !== -1) {
      // If the user has already liked the tweet, remove the like
      tweet.likes.splice(alreadyLikedIndex, 1);
      await tweet.save();
      return res.status(200).json({ message: 'Tweet unliked successfully' });
    } else {
      // If the user has not liked the tweet, add the like
      tweet.likes.push(userId);
      await tweet.save();
      return res.status(200).json({ message: 'Tweet liked successfully' });
    }
  } catch (error) {
    console.error('Error liking/unliking tweet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

*/

// Retweet a tweet
export const retweetTweet = async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id; // Assuming user ID is available in the request

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Check if the user has already retweeted the tweet
    const alreadyRetweetedIndex = tweet.retweets.findIndex(retweet => retweet.equals(userId));

    if (alreadyRetweetedIndex === -1) {
      // If the user has not retweeted the tweet, add their ID to the retweets array
      tweet.retweets.push(userId);
      await tweet.save();
      return res.status(200).json({ message: 'Tweet retweeted successfully' });
    } else {
      // If the user has already retweeted the tweet, return an error
      return res.status(400).json({ message: 'Tweet already retweeted by the user' });
    }
  } catch (error) {
    console.error('Error retweeting tweet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Unretweet a tweet
export const unretweetTweet = async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id; // Assuming user ID is available in the request

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Check if the user has retweeted the tweet
    const alreadyRetweetedIndex = tweet.retweets.findIndex(retweet => retweet.equals(userId));

    if (alreadyRetweetedIndex !== -1) {
      // If the user has retweeted the tweet, remove their ID from the retweets array
      tweet.retweets.splice(alreadyRetweetedIndex, 1);
      await tweet.save();
      return res.status(200).json({ message: 'Tweet unretweeted successfully' });
    } else {
      // If the user has not retweeted the tweet, return an error
      return res.status(400).json({ message: 'Tweet not retweeted by the user' });
    }
  } catch (error) {
    console.error('Error unretweeting tweet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// bookmark a tweet 
export const bookmarkTweet = async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Check if the tweet is already bookmarked by the user
    const alreadyBookmarked = tweet.bookmarks.some(bookmark => bookmark.equals(userId));

    if (alreadyBookmarked) {
      return res.status(400).json({ message: 'Tweet already bookmarked by the user' });
    }

    // Update the bookmark count in the stat field
    tweet.stat.bookmark += 1;

    // Add the user ID to the bookmarks array
    tweet.bookmarks.push(userId);

    // Save the updated tweet
    await tweet.save();

    return res.status(200).json({ message: 'Tweet bookmarked successfully' });
  } catch (error) {
    console.error('Error bookmarking tweet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const unbookmarkTweet = async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Check if the tweet is bookmarked by the user
    const bookmarkIndex = tweet.bookmarks.findIndex(bookmark => bookmark.equals(userId));

    if (bookmarkIndex === -1) {
      return res.status(400).json({ message: 'Tweet not bookmarked by the user' });
    }

    // Update the bookmark count in the stat field
    tweet.stat.bookmark -= 1;

    // Remove the user ID from the bookmarks array
    tweet.bookmarks.splice(bookmarkIndex, 1);

    // Save the updated tweet
    await tweet.save();

    return res.status(200).json({ message: 'Tweet unbookmarked successfully' });
  } catch (error) {
    console.error('Error unbookmarking tweet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
/*        IF THE USER ALREADY bookmarked THE TWEET => unbookmard THE TWEET , et vice versa 
export const toggleBookmark = async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Check if the tweet is already bookmarked by the user
    const bookmarkIndex = tweet.bookmarks.findIndex(bookmark => bookmark.equals(userId));

    if (bookmarkIndex !== -1) {
      // If the tweet is already bookmarked, unbookmark it
      tweet.stat.bookmark -= 1;
      tweet.bookmarks.splice(bookmarkIndex, 1);
      await tweet.save();
      return res.status(200).json({ message: 'Tweet unbookmarked successfully' });
    } else {
      // If the tweet is not bookmarked, bookmark it
      tweet.stat.bookmark += 1;
      tweet.bookmarks.push(userId);
      await tweet.save();
      return res.status(200).json({ message: 'Tweet bookmarked successfully' });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

*/