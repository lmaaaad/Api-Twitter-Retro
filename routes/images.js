import express from "express";
import Router from "express";
import { getProfile, getBanner, getPostImages,updateBanner, updateProfile} from "../controllers/image.js";

import { verifyToken } from "../middleware/auth.js";
import multer from "multer";

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Define destination directory based on file type
        if (req.route.path === '/profile') {
            cb(null, 'public/assets/profile');
        } else if (req.route.path === '/banner') {
            cb(null, 'public/assets/banner');
        }
    },
    filename: function (req, file, cb) {
        // Define filename as current timestamp + original filename
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });
// Middleware for setting profile images
export const setProfile = upload.single('image');

// Middleware for setting banner images
export const setBanner = upload.single('image');



//router.post("/profile", setProfile);
router.post("/banner",verifyToken ,setBanner,updateBanner);
router.post("/profile",verifyToken ,setProfile,updateProfile);


router.get("/profile/:id", getProfile);
router.get("/banner/:id",  getBanner);
router.get("/post/:id", getPostImages);

export default router;
