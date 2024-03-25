import Jwt from "jsonwebtoken";

export const verifyToken = (req, res , next) => {
    try {
        
        let token = req.header("Auth");

        if (!token){
            res.status(403).send("Acess Denied");
            return
        }
        if (token.startsWith("Bearer ")) {

            token = token.slice(7, token.length).trimLeft();

        }
        const  verified =  Jwt.verify(token, process.env.JWT_SECRET);

        req.user = verified;
        next();

    } catch (err) {
        res.status(500).json({ error: err.message})
    }
};