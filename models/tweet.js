import mongoose from "mongoose";

const tweetSchema = new mongoose.Schema({

    author: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
        
    content: String,

    },

    {timestamps: true});
  
  const Tweet = mongoose.model('Tweet', tweetSchema);
  
  module.exports = Tweet;