import User from "../models/user.js";
import asyncHandler from "express-async-handler";

import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import fs from "fs";
import Tweet from "../models/tweet.js";


//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Public
export const searchUser = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          // Use a regular expression to match the full name with optional spaces between each character
          { fullName: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
          { tag: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword, '-password').find({ _id: { $ne: req.user._id } });;
  res.status(200).send(users);
});

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
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const user = await User.findOne({ tag });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const startIndex = (page - 1) * pageSize;

    const postsIds = user.tweets.slice(startIndex, startIndex + pageSize);

    const posts = await Tweet.find({ _id: { $in: postsIds } });

    res.status(200).json({
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil(user.tweets.length / pageSize),
      totalItems: user.tweets.length,
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

    const startIndex = (page - 1) * pageSize;

    const retweetsIds = user.retweets.slice(startIndex, startIndex + pageSize);

    const retweets = await Tweet.find({ _id: { $in: retweetsIds } });

    res.status(200).json({
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil(user.retweets.length / pageSize),
      totalItems: user.retweets.length,
      data: retweets,
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

    const likesIds = user.likes.slice(startIndex, startIndex + pageSize);

    const likes = await Tweet.find({ _id: { $in: likesIds } });

    res.status(200).json({
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil(user.likes.length / pageSize),
      totalItems: user.likes.length,
      data: likes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

