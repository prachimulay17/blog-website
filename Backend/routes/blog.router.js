import { Router } from "express";
import { createBlog,getAllBlogs,getBlogById,updateBlog,deleteBlog,searchBlogs } from "../controllers/blog.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post(
  "/createblog",
 verifyJWT,
  upload.fields([{ name: "coverImage", maxCount: 1 }]),
  createBlog
);

router.route("/search").get(searchBlogs);

router.route("/").get(getAllBlogs);
router.route("/:blogId").get(getBlogById);

router.route("/:blogId").patch(verifyJWT,upload.fields([{ name: "coverImage", maxCount: 1 }]),updateBlog);
router.route("/:blogId").delete(verifyJWT,deleteBlog);

export default router;
