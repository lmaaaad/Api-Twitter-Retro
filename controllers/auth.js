import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";
import User from "../models/user.js"
/*
import tweet from "../models/tweet.js"
import reply from "../models/reply.js"
import like from "../models/like.js"
import notification from "../models/notification.js"
import followrequest from "../models/followrequest.js" 
*/

/* REGISTER USER */    
export const register= async(req, res) => {
    try{
        const {
            userName,               //i added username 
            firstName,
            lastName,
            email,
            password,
            picturePath,
            friends,
            tweets,
            
        } = req.body;

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({
            userName,
            firstName,
            lastName,
            email,
            password: passwordHash,
            picturePath,
            friends,
            
        });
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    }catch(err){
        res.status(500).json({error: err.message});
    }
}

/* LOGIN */

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) return res.status(401).json({ msg: "User doesn't exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "invalid creds" });

    const token = Jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    delete user.password;
    res.status(200).json({ token: token, user: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
