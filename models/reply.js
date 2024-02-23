import mongoose from "mongoose";

const replySchema = new mongoose.Schema({

    author: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    
    },

    tweet: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Tweet' 
    },
    
    content: String,

    
  },
  {timestamps: true}
  );
  
  const Reply = mongoose.model('Reply', replySchema);
  
  module.exports = Reply;