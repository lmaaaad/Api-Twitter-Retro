import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";
import User from "../models/user.js"
import nodemailer from "nodemailer";
import crypto from "crypto";
import ResetToken from "../models/resetToken.js";


/*
import tweet from "../models/tweet.js"
import reply from "../models/reply.js"
import like from "../models/like.js"
import notification from "../models/notification.js"
import followrequest from "../models/followrequest.js" 
*/

/* REGISTER USER */    
export const register= async(req, res) => {
  console.log(req.body);
    try{
        const {
            tag,               //i added username 
            fullName,
            email,
            password,
            //picturePath,
            
        } = req.body;

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({
            tag,
            fullName,
            email,
            password: passwordHash,
            //picturePath,
            
        });
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    }catch(err){
        console.log(err);
        res.status(500).json({error: err.message});
    }
}

/* LOGIN */

export const login = async (req, res) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) return res.status(401).json({ msg: "User doesn't exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "invalid creds" });

    const token = Jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    await User.findByIdAndUpdate(user._id, { $set: { token } }); //add token to user. 

    delete user.password;
    res.status(200).json({ token: token, user: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* Node Mailer */ 
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, 
  auth: {
    user: 'twitter-retro-uvsq@outlook.com',
    pass: 'iL9594fR5xnErAK@'
  }
});

/* Request Password Reset */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user in the database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Generate a reset token
    const token = crypto.randomBytes(20).toString("hex");
    const expires = Date.now() + 3600000; // Token expires in 1 hour

    // Store the reset token in the database
    const resetToken = new ResetToken({
      userId: user._id,
      token,
      expires,
    });
    await resetToken.save();

    // Construct the password reset email
    const mailOptions = {
      from: "twitter-retro-uvsq@outlook.com",
      to: email,
      subject: "Password Reset Request",
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n`
        + `Please click on the following link to reset your password:\n\n`
        + `http://${req.headers.host}/auth/reset-password?token=${token}\n\n`
        + `If you did not request this, please ignore this email, and your password will remain unchanged.\n`
    };

    // Send the password reset email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: "Error sending email" });
      } else {
        console.log("Email sent: " + info.response);
        res.status(200).json({ msg: "Password reset email sent" });
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
/*logout*/
export const logout = async (req, res) => {
  try {
    const token = req.header("Authorization").split(" ")[1];
    if (!token) {
      return res.status(403).send("Access Denied");
    }

    // Find the user by token and update the token field to null
    const user = await User.findOneAndUpdate({ token }, { token: null });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error("Unexpected logout error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
/* Reset Password */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find the reset token in the database
    const resetToken = await ResetToken.findOne({ token });

    if (!resetToken) {
      return res.status(400).json({ msg: "Invalid or expired token" });
    }

    // Check if the token has expired
    if (resetToken.expires < Date.now()) {
      // If expired, delete the token and return error
     // await resetToken.remove();
     await resetToken.deleteOne({ token }); 
     return res.status(400).json({ msg: "Token has expired" });
    }

    // Find the user associated with the reset token
    const user = await User.findById(resetToken.userId);

    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    // Update user's password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(newPassword, salt);
    user.password = passwordHash;

    // Remove the reset token from the database
   // await resetToken.remove();
   await resetToken.deleteOne({ token }); 

    // Save the updated user
    await user.save();

    res.status(200).json({ msg: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err); // Log the error for debugging
    res.status(500).json({ error: "Internal server error" });
  }

  
};