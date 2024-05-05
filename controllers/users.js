import User from "../models/user.js";

import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import fs from "fs";

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

// export const getUserFriends = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const user = await User.findById(id);
//     const friends = await Promise.all(
//       user.friends.map((id) => User.findById(id))
//     );
//     const formattedFriends = friends.map(
//       ({ _id, userName, firstName, lasrName, email, picturePath }) => {
//         return { _id, userName, firstName, lasrName, email, picturePath };
//       }
//     );

//     res.status(200).json(formattedFriends);
//   } catch (err) {
//     res.status(404).json({ message: err.message });
//   }
// };
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

export const addFieldUser = async (req, res) => {
  //await User.updateMany({ bio: { $exists: false } }, { $set: { bio: "" } });
  //User.updateMany({}, { $set: { "stat.followingCount": 0 } });
  res.status(200).json({ message: "User modify success" });
};
