import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import fs from "fs";

import User from "../models/user.js";

export const getProfile = async (req, res) => {
  const id = req.params.id;

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
    id + ".png"
  );

  try {
    if (!fs.existsSync(imageFolder)) {
      return res.sendFile(defaultPath);
    }

    return res.sendFile(imageFolder);
  } catch (error) {
    console.error(error);
    returnres.status(500).json({ message: "Internal server error" });
  }
};

export const getBanner = async (req, res) => {
  const id = req.params.id;

  const absoluteImagePath = path.join(
    __dirname,
    "..",
    "public",
    "assets",
    "banner",
    id + ".png"
  );

  try {
    if (!fs.existsSync(absoluteImagePath)) {
      res.status(404).json({ message: "No banner" });
    }

    res.sendFile(absoluteImagePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPostImage = async (req, res) => {
  const id = req.params.id;

  const imagePath = path.join(
    __dirname,
    "..",
    "public",
    "assets",
    "post",
    id + ".png"
  );

  try {
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: "Post have no images" });
    }

    res.sendFile(imagePath);
  } catch (error) {
    console.error(error);
  }
};

export const updateBanner = async (req, res) => {
  try {
    res.status(200).json({ message: "Banner image updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
