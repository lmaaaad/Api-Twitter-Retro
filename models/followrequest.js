import mongoose from "mongoose";

const followRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: String,
  },
  { timestamps: true }
);

const FollowRequest = mongoose.model("FollowRequest", followRequestSchema);

module.exports = FollowRequest;
