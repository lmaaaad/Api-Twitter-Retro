import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      unique: true,
      //required: true,
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
    picturePath: {
      type: String,
      default: "",
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
