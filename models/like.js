import mongoose from "mongoose";


const likeSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },

    tweet: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Tweet' 
    },
    reply: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Reply' 
    },

   
  }, {timestamps: true});
  
  const Like = mongoose.model('Like', likeSchema);
  
  module.exports = Like;