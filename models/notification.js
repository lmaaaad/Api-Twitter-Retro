import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    type: String,
    tweet: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Tweet' 
    },
    read: { 
        type: Boolean, 
        default: false 
    },

    
  }, {timestamps: true});
  
  const Notification = mongoose.model('Notification', notificationSchema);
  
  module.exports = Notification;