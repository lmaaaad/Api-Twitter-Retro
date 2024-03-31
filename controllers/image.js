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
    "public",
    "assets",
    "profile",
    "default.png"
  );

  try {
    const user = await User.findOne({ tag: tag });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const picturePath = user.profileImage;

    if (!picturePath) {
      res.sendFile(defaultPath);
    }

    const absoluteImagePath = path.join(__dirname, "..", picturePath);

    // Send the image file back to the client
    res.sendFile(absoluteImagePath);
  } catch (error) {
    console.error(error);
  }
};

export const getBanner = async (req, res) => {
  const tag = req.params.tag;

  try {
    const user = await User.findOne({ tag: tag });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const picturePath = user.bannerImage;

    if (!picturePath) {
      res.status(400).json({ message: "No banner" });
    }

    const absoluteImagePath = path.join(__dirname, "..", picturePath);

    res.sendFile(absoluteImagePath);
  } catch (error) {
    console.error(error);
  }
};

export const getPostImages = async (req, res) => {
  const id = req.params.id;

  const imageFolder = path.join(__dirname, "public", "assets", "post", id);

  try {
    if (!fs.existsSync(imageFolder)) {
      return res.status(404).json({ error: "No images found" });
    }

    fs.readdir(imageFolder, (err, files) => {
      if (err) {
        return res
          .status(404)
          .json({ message: "Images folder does not exist for this post" });
      }

      res.json({ files });
    });
  } catch (error) {
    console.error(error);
  }
};
