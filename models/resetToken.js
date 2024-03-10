import mongoose from "mongoose";

const ResetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  token: {
    type: String,
    required: true
  },
  expires: {
    type: Date,
    default: Date.now() + 3600000 // Token expires in 1 hour
  }
});

const ResetToken = mongoose.model("ResetToken", ResetTokenSchema);

export default ResetToken;