
import express from "express";
import Router from "express";
import {
    getUser,
    getUserFriends,
    updateUser,
    searchUser
   // addRemoveFriends,
    
} from "../controllers/users.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/*  READ */

router.get("/:id", verifyToken , getUser);
router.get("/:id/followers", verifyToken , getUserFriends);

//UPDATE USER 
router.patch("/:id", verifyToken, updateUser);

//SEARCH USER
router.get("/", verifyToken,searchUser);    


// UPDATE

//router.patch("/:id/followerId", verifyToken, addRemoveFriends);


export default router;