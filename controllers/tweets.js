import Tweet from "../models/tweet.js";
import User from "../models/user.js";

import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import fs from "fs";
import Hashtag from "../models/hashtag.js";

export const getAllTweets = async (req, res) => {
  try {
    const currentUser = req.user;
    // Extract pagination parameters from query string
    const page = parseInt(req.query.page) || 1; // Current page number, default to 1
    const pageSize = parseInt(req.query.pageSize) || 20; // Number of tweets per page

    if (!currentUser) {
      return res.status(400).json({ message: err.message });
    }

    // Calculate skip value to paginate results
    const skip = (page - 1) * pageSize;

    console.log(currentUser.following);

    const tweets = await Tweet.find({ author: { $in: currentUser.following } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const totalTweets = await Tweet.countDocuments({
      user: { $in: currentUser.following },
    });

    for (const tweet of tweets) {
      tweet.stat.view += 1;
      await tweet.save();
    }

    const totalPages = Math.ceil(totalTweets / pageSize);

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

export const getFeedTrendy = async (req, res) => {
  try {
    const user = req.user;

    const page = parseInt(req.query.page) || 1; // Current page number, default to 1
    const pageSize = parseInt(req.query.pageSize) || 10; // Number of tweets per page

    const skip = (page - 1) * pageSize;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    //if (!user.recommandation || user.recommandation.length == 0) {
    const topHashtags = await Hashtag.aggregate([
      { $match: { createdAt: { $gte: oneWeekAgo } } }, // Match hashtags created within the last week
      { $group: { _id: "$text", count: { $sum: 1 } } }, // Group hashtags by text and calculate count
      { $sort: { count: -1 } }, // Sort hashtags by count in descending order
      { $limit: 10 }, // Limit results to the top 100 hashtags
    ]);

    const tweets = [];
    // Iterate over each top hashtag
    for (const hashtagObj of topHashtags) {
      const hashtag = hashtagObj._id;
      // Query database for posts containing the hashtag
      const posts = await Tweet.find({
        body: { $regex: `#${hashtag}\\b`, $options: "i" },
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize);
      tweets.push(...posts);
    }
    const totalTweets = tweets.length;
    const totalPages = Math.ceil(totalTweets / pageSize);

    const uniqueTweets = Array.from(
      new Set(tweets.map((tweet) => JSON.stringify(tweet)))
    ).map((json) => JSON.parse(json));

    const tweetsResult = uniqueTweets.slice(skip, skip + pageSize);

    return res.status(200).json({ tweets: tweetsResult, totalPages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//Function to extract Hashtags from tweets
const extractHashtags = (body) => {
  const regex = /#(\w+)/g;
  const matches = body.match(regex);
  if (matches) {
    return matches.map((match) => ({ text: match.substring(1) }));
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
        console.log("----------------------------- HERE CA MARCHE");
        console.log(existingHashtag.count);
        await existingHashtag.save();
      } else {
        // If the hashtag doesn't exist, create a new document
        const newHashtag = new Hashtag({ text: tag.text, count: 1 });
        await newHashtag.save();
      }
    }
  } catch (error) {
    console.error("Error updating hashtags:", error);
    //throw error; // Propagate the error back to the caller
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
    const posts = await Tweet.find({
      body: { $regex: `#${hashtag}\\b`, $options: "i" },
    })
      .sort({ [`hashtags.${hashtag}`]: -1 })
      .skip(skip) // Skip the specified number of documents
      .limit(pageSize); // Limit the number of posts to the page size

    // Count total number of posts containing the hashtag
    const totalPosts = await Tweet.countDocuments({
      body: { $regex: `#${hashtag}\\b`, $options: "i" },
    });

    // Calculate total number of pages
    const totalPages = Math.ceil(totalPosts / pageSize);

    // Construct pagination metadata
    const pagination = {
      currentPage: page,
      totalPages: totalPages,
      pageSize: pageSize,
      totalCount: totalPosts,
    };

    for (const tweet of posts) {
      tweet.stat.view += 1;
      await tweet.save();
    }

    // Send response with paginated posts and pagination metadata
    return res.status(200).json({ posts, pagination });
  } catch (error) {
    console.error("Error searching for hashtag:", error);
    return res.status(500).json({ error: "Internal server error" });
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
    const hashtags = extractHashtags(body);

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
  // TODO
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

    if (!user) {
      return res.status(400).json({ message: "Bad request" });
    }

    user.likes.push(tweetId);
    user.stat.likeCount++;
    const hashtags = extractHashtags(tweet.body);
    for (const hashtag of hashtags) {
      if (!user.recommandation) {
        break;
      }
      user.recommandation.push(hashtag);
      if (user.recommendations.length > 100) {
        user.recommendations.shift();
      }
    }
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
      const hashtags = extractHashtags(tweet.body);
      for (const hashtag of hashtags) {
        if (!user.recommandation) {
          break;
        }
        user.recommandation.push(hashtag);
        if (user.recommendations.length > 100) {
          user.recommendations.shift();
        }
      }
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

    for (const tweet of tweets) {
      tweet.stat.view += 1;
      await tweet.save();
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

    for (const tweet of lastCommentsIds) {
      tweet.stat.view += 1;
      await tweet.save();
    }

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

export const getTopHashtags = async (req, res) => {
  try {
    // Calculate pagination parameters
    const page = parseInt(req.query.page) || 1; // Current page number, default to 1
    const pageSize = parseInt(req.query.pageSize) || 10; // Number of hashtags per page
    const skip = (page - 1) * pageSize;

    // Calculate the date one week ago

    // Aggregate tweets with hashtags created in the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const topHashtags = await Hashtag.find()
      .sort({ count: -1 }) // Trie par ordre décroissant de count
      .limit(10) // Limite à 10 résultats
      .select("text count"); // Sélectionne uniquement le champ count

    // Return the top hashtags and pagination metadata as JSON response
    console.log(topHashtags);
    res.status(200).json({
      hashtags: topHashtags,
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalCount: topHashtags.length, // This may not be accurate if there are more than 100 hashtags in the last week
      },
    });
  } catch (err) {
    // Handle errors
    res.status(500).json({ error: "Internal Server Error" });
  }
};
