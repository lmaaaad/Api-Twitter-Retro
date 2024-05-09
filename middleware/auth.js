import Jwt from "jsonwebtoken";
import User from "../models/user.js"; // Import your User model

export const verifyToken = async (req, res, next) => {
  try {
    if (req.path === "/auth/logout") {
      return next();
    }

    let token = req.header("Auth");

    if (!token) {
      res.status(403).send("Access Denied");
      return;
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }

    const decoded = Jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id); // Assuming your user ID is stored in the token

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    req.user = user; // Attach the user object to the request
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
