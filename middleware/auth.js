import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const verifyToken = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      //decodes token id
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      //console.log(decoded);

      req.user = await User.findById(decoded.id).select("-password");
      console.log(req.user._id);
      next();
    } catch (error) {
      res.status(401).send("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401).send("Not authorized, no token");
  }
};
export default verifyToken;