import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import User from "../models/user.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const getBanner = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await User.findOne({ id: id });

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

export const getProfile = async (req, res) => {
  const userId = req.params.id;
  console.log(userId);
  try {
      const user = await User.findById(userId);

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Extract the picturePath from the user object
      const picturePath = user.profileImage;

      // If picturePath is not available or is empty, return default image or appropriate error response
      if (!picturePath) {
          return res.status(404).json({ message: 'User does not have a profile picture' });
      }

      // Construct absolute path to the image file
      const absoluteImagePath = path.resolve(__dirname, '..', picturePath);
      console.log(absoluteImagePath);

      // Send the image file back to the client
      res.sendFile(absoluteImagePath);
  } catch (error) {
      console.error(error);
  }
}