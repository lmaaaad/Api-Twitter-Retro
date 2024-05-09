import User from "../models/user.js";
import asyncHandler from "express-async-handler";

import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import fs from "fs";
import Tweet from "../models/tweet.js";

export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId, {
      password: 0,
      token: 0,
      __v: 0,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, {
      notifications: 0,
      password: 0,
      token: 0,
      __v: 0,
    });

    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUsersByIds = async (req, res) => {
  try {
    const ids = req.query.ids;
    const users = await User.find(
      { _id: { $in: ids } },
      { notifications: 0, password: 0, token: 0, __v: 0 }
    );

    res.status(200).json(users);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserByTag = async (req, res) => {
  try {
    const { tag } = req.params;

    const user = await User.findOne({ tag });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const author = req.user.id;

    // Find  user by ID and update
    const updatedUser = await User.findByIdAndUpdate(
      author,
      { fullName: name, bio: bio },
      {
        new: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const followUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (currentUser.following.includes(id)) {
      return res
        .status(400)
        .json({ message: "User is already being followed" });
    }

    currentUser.following.push(id);
    currentUser.stat.followingCount++;
    await currentUser.save();

    const followedUser = await User.findById(id);
    if (!followedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    followedUser.followers.push(currentUser._id);
    followedUser.stat.followersCount++;
    await followedUser.save();

    res.status(200).json({ message: "User followed successfully" });
  } catch (err) {
    console.error("Follow user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const unfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser.following.includes(id)) {
      return res.status(400).json({ message: "User is not being followed" });
    }

    currentUser.following = currentUser.following.filter((_id) => {
      if (_id) {
        _id.toString() !== id;
      }
    });
    currentUser.stat.followingCount--;

    await currentUser.save();

    const currentUserID = currentUser._id ? currentUser._id.toString() : null;
    const followedUser = await User.findById(id);
    if (!followedUser) {
      console.error("user not found");
      return res.status(404).json({ message: "User not found" });
    }
    followedUser.followers = followedUser.followers.filter(
      (_id) => _id.toString() !== currentUserID
    );
    followedUser.stat.followersCount--;
    await followedUser.save();

    res.status(200).json({ message: "User unfollowed successfully" });
  } catch (err) {
    console.error("Unfollow user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSearchUsers = async (req, res) => {
  const { search } = req.params;

  if (!search) {
    return res
      .status(400)
      .json({ error: "Veuillez fournir un terme de recherche" });
  }

  const filteredUsers = await User.find(
    {
      fullName: { $regex: `^${search}`, $options: "i" },
    },
    {
      notifications: 0,
      password: 0,
      token: 0,
      __v: 0,
    }
  ).limit(10);

  res.status(200).json(filteredUsers);
};

export const getFollowers = async (req, res) => {
  try {
    const { tag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const user = await User.findOne({ tag });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const startIndex = (page - 1) * pageSize;

    const followersIds = user.followers.slice(
      startIndex,
      startIndex + pageSize
    );

    const followers = await User.find({ _id: { $in: followersIds } });

    res.status(200).json({
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil(user.followers.length / pageSize),
      totalItems: user.followers.length,
      data: followers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { tag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const user = await User.findOne({ tag });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const startIndex = (page - 1) * pageSize;

    const followingIds = user.following.slice(
      startIndex,
      startIndex + pageSize
    );

    const following = await User.find({ _id: { $in: followingIds } });

    res.status(200).json({
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil(user.following.length / pageSize),
      totalItems: user.following.length,
      data: following,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { tag } = req.params;
    const type = req.query.type;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const user = await User.findOne({ tag });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const skip = (page - 1) * pageSize;

    try {
      var posts = await Tweet.find(
        {
          _id: { $in: user.tweets },
          type: type,
        },
        {
          replies: 0,
        }
      )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize);
    } catch (e) {
      console.error(err);
      res.status(500).json({ message: "Erreur Recherche MongoDb" });
    }

    if (type == "reply") {
      var countReplies = await Tweet.countDocuments({
        type: type,
      });
    }

    for (const tweet of posts) {
      tweet.stat.view += 1;
      await tweet.save();
    }

    res.status(200).json({
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil(
        (type == "reply" ? countReplies : user.tweets.length) / pageSize
      ),
      totalItems: type == "reply" ? countReplies : user.tweets.length,
      data: posts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getUserRetweets = async (req, res) => {
  try {
    const { tag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const user = await User.findOne({ tag });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const skip = (page - 1) * pageSize;

    const retweetsInDB = await Tweet.find(
      { _id: { $in: user.retweets } },
      {
        replies: 0,
      }
    )
      .skip(skip)
      .limit(pageSize);

    const existingRetweetsIds = retweetsInDB.map((retweet) => retweet._id);

    await User.updateOne(
      { _id: user._id },
      { $pull: { retweets: { $nin: existingRetweetsIds } } }
    );

    res.status(200).json({
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil(existingRetweetsIds.length / pageSize),
      totalItems: existingRetweetsIds.length,
      data: retweetsInDB,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getUserBookmarks = async (req, res) => {
  try {
    const { tag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const user = await User.findOne({ tag });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const skip = (page - 1) * pageSize;

    const bookmarksInDB = await Tweet.find(
      { _id: { $in: user.bookmarks } },
      {
        replies: 0,
      }
    )
      .skip(skip)
      .limit(pageSize);

    const existingBookmarksIds = bookmarksInDB.map((bookmark) => bookmark._id);

    await User.updateOne(
      { _id: user._id },
      { $pull: { bookmarks: { $nin: existingBookmarksIds } } }
    );

    res.status(200).json({
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil(existingBookmarksIds.length / pageSize),
      totalItems: existingBookmarksIds.length,
      data: bookmarksInDB,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getUserLikes = async (req, res) => {
  try {
    const { tag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const user = await User.findOne({ tag });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const startIndex = (page - 1) * pageSize;

    const likesInDB = await Tweet.find(
      { _id: { $in: user.likes } },
      {
        replies: 0,
      }
    )
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(pageSize);

    const existingLikesIds = likesInDB.map((like) => like._id);

    await User.updateOne(
      { _id: user._id },
      { $pull: { likes: { $nin: existingLikesIds } } }
    );

    res.status(200).json({
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil(existingLikesIds.length / pageSize),
      totalItems: existingLikesIds.length,
      data: likesInDB,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
