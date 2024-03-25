import Jwt from "jsonwebtoken";
import User from "../models/user.js"; // Import your User model

export const verifyToken = async (req, res, next) => {
    try {
        // Check if the request is for logout
        if (req.path === '/auth/logout') {
            // Skip token verification for logout endpoint
            return next();
        }

        let token = req.header("Authorization");

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
            throw new Error("User not found");
        }

        req.user = user; // Attach the user object to the request
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
