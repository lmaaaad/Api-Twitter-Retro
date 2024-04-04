import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import Tweet from "../models/tweet.js";
import User from "../models/user.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));


export const updateProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove previous profile image if it exists and it's not the default image
    if (user.profileImage && !user.profileImage.startsWith('default')) {
      const previousImagePath = path.join(__dirname, "..", user.profileImage);
      fs.unlinkSync(previousImagePath);
    }

    // Update profile image path in the database
    user.profileImage = req.file.path;
    await user.save();

    res.status(200).json({ message: "Profile image updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const updateBanner = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove previous banner image if it exists and it's not the default image
    if (user.bannerImage && !user.bannerImage.startsWith('default')) {
      const previousImagePath = path.join(__dirname, "..", user.bannerImage);
      fs.unlinkSync(previousImagePath);
    }

    // Update banner image path in the database
    user.bannerImage = req.file.path;
    await user.save();

    res.status(200).json({ message: "Banner image updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getBanner = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const picturePath = user.bannerImage;

    if (!picturePath) {
      return res.status(400).json({ message: "No banner" });
    }

    const absoluteImagePath = path.join(__dirname, "..", picturePath);

    res.sendFile(absoluteImagePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPostImages = async (req, res) => {
  const tweetId = req.params.id;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    const picturePath = tweet.postImage;

    if (!picturePath) {
      return res.status(404).json({ message: 'Tweet does not have an image' });
    }

    const absoluteImagePath = path.resolve(__dirname, '..', picturePath);

    res.sendFile(absoluteImagePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProfile = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const picturePath = user.profileImage;

    if (!picturePath) {
      return res.status(404).json({ message: 'User does not have a profile picture' });
    }

    const absoluteImagePath = path.resolve(__dirname, '..', picturePath);

    res.sendFile(absoluteImagePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
