import {Router} from 'express';
import { registeruser,loginUser,logoutUser,refreshAccessToken,getCurrentUser,updateUser,deleteUser} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';   
import { verifyJWT } from '../middlewares/auth.middleware.js';
const router = Router();

router.route('/register').post(upload.fields([
    {name: 'avatar', maxCount: 1}
]),registeruser);

router.route('/login').post(loginUser);
router.route('/logout').post(verifyJWT,logoutUser);
router.route('/refresh-token').post(refreshAccessToken);
router.get("/me", verifyJWT,getCurrentUser);



router.patch(
  "/update",
  verifyJWT,
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  updateUser
);

router.route('/delete').delete(verifyJWT,deleteUser);

export default router;