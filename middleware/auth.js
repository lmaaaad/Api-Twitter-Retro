import Jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
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

        const verified = Jwt.verify(token, process.env.JWT_SECRET);

        req.user = verified;
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
