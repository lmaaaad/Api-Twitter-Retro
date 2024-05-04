import User from "../models/user.js";
import asyncHandler from "express-async-handler";



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