import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      unique: true,
      required: true,
      min: 4,
      max: 50,
    },

    fullName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    email: {
      type: String,
      required: true,
      min: 2,
      unique: true,
    },
    password: {
      type: String,
      require: true,
      min: 2,
    },
    dob: {
      type: String,
    },
    profileImage: {
      type: String,
      default: "https://res.cloudinary.com/djvjxp2am/image/upload/v1626828184/default-profile-image_kxvq0v.png",
    },
    bannerImage: {
      type: String,
    },
    bio: {
      type: String,
    },
    token: {
      type: String,
    },
    tweets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet",
        autopopulate: {
          maxDepth: 2,
        },
      },
    ],
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        autopopulate: { select: "tag", maxDepth: 1 },
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        autopopulate: { select: "tag", maxDepth: 1 },
      },
    ],
    notifications: Array,
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
export default User;