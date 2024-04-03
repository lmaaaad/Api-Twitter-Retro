import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import fs from "fs";

import User from "../models/user.js";

export const getProfile = async (req, res) => {
  const tag = req.params.tag;

  const defaultPath = path.join(
    __dirname,
    "..",
    "public",
    "assets",
    "profile",
    "default.png"
  );

  const imageFolder = path.join(
    __dirname,
    "..",
    "public",
    "assets",
    "profile",
    tag
  );

  try {
    const user = await User.findOne({ tag: tag });

    if (!user) {
      res.sendFile(defaultPath);
      //return res.status(404).json({ message: "User not found" });
    }

    const picturePath = user.profileImage;

    if (!picturePath) {
      res.sendFile(defaultPath);
    }

    if (!fs.existsSync(imageFolder)) {
      return res.sendFile(defaultPath);
    }

    // Send the image file back to the client
    res.sendFile(imageFolder);
  } catch (error) {
    console.error(error);
  }
};

export const getBanner = async (req, res) => {
  const tag = req.params.tag;

  const absoluteImagePath = path.join(
    __dirname,
    "..",
    "public",
    "assets",
    "banner",
    tag
  );

  try {
    const user = await User.findOne({ tag: tag });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const picturePath = user.bannerImage;

    if (!picturePath) {
      res.status(400).json({ message: "No banner" });
    }

    if (!fs.existsSync(imageFolder)) {
      res.status(400).json({ message: "No banner" });
    }

    res.sendFile(absoluteImagePath);
  } catch (error) {
    console.error(error);
  }
};

/*
export const getPostImages = async (req, res) => {
  const id = req.params.id;
  const number = req.params.number;

  const imageFolder = path.join(__dirname, "public", "assets", "post", id);

  const absoluteImagePath = path.join(
    __dirname,
    "public",
    "assets",
    "post",
    id,
    number
  );

  try {
    if (!fs.existsSync(imageFolder)) {
      return res.status(404).json({ error: "Post have no images" });
    }

    if (!fs.existsSync(absoluteImagePath)) {
      return res.status(404).json({ error: "Image number not valid" });
    }

    res.sendFile(absoluteImagePath);
  } catch (error) {
    console.error(error);
  }
};*/

export const getPostImage = async (req, res) => {
  const id = req.params.id;

  const imagePath = path.join(__dirname, "public", "assets", "post", id);

  try {
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: "Post have no images" });
    }

    res.sendFile(imagePath);
  } catch (error) {
    console.error(error);
  }
};
