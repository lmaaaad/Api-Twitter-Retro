import mongoose from "mongoose";

const { Schema, model } = mongoose;

const hashtagSchema = new Schema(
  {
  text: {
    type: String,
    required: true,
    unique: true,
  },
  count: {
    type: Number,
    default: 0,
  },
  },
  { timestamps: true }
);

const Hashtag = model("Hashtag", hashtagSchema);

export default Hashtag;
