import { Blog } from "../models/blog.model.js";
import { asyncHandeler } from "../utils/async-handeler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadoncloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";


const createBlog = asyncHandeler(async (req, res) => {
  const { title, content, isPublished } = req.body;

  if (!title || !content) {
    throw new ApiError(400, "Title and content are required");
  }

  let coverImageUrl = "";
  const coverLocalPath = req.files?.coverImage?.[0]?.path;
 

  if (coverLocalPath) {
    const cover = await uploadoncloudinary(coverLocalPath);
    if (!cover) {
      throw new ApiError(500, "Cover image upload failed");
    }
    
    coverImageUrl = cover.secure_url;
  }

  const blog = await Blog.create({
    title,
    content,
    coverImage: coverImageUrl,
    author: req.user._id,
    isPublished: isPublished ?? true
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Blog created successfully", blog));
});


const getAllBlogs = asyncHandeler(async (req, res) => {
  const blogs = await Blog.find({ isPublished: true })
    .populate("author", "username avatar")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200,"Blogs fetched successfully",blogs));
});


const getBlogById = asyncHandeler(async (req, res) => {
  const { blogId } = req.params;

  const blog = await Blog.findById(blogId).populate(
    "author",
    "username avatar"
  );

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Blog fetched successfully", blog));
});


const updateBlog = asyncHandeler(async (req, res) => {
  const { blogId } = req.params;
  const { title, content, isPublished } = req.body;

  //  Validate blogId
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    throw new ApiError(400, "Invalid blog ID");
  }

  //  Find blog
  const blog = await Blog.findById(blogId);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  //  AUTHOR CHECK (MOST IMPORTANT)
  if (blog.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this blog");
  }

  //  Prepare update object
  const updateData = {};

  if (title) updateData.title = title;
  if (content) updateData.content = content;
  if (typeof isPublished !== "undefined") {
    updateData.isPublished = isPublished;
  }

  //  Cover image update (optional)
  const coverLocalPath = req.files?.coverImage?.[0]?.path;
  if (coverLocalPath) {
    const cover = await uploadoncloudinary(coverLocalPath);
    if (!cover) {
      throw new ApiError(500, "Cover image upload failed");
    }
    updateData.coverImage = cover.secure_url;
  }

  //  Update blog
  const updatedBlog = await Blog.findByIdAndUpdate(
    blogId,
    { $set: updateData },
    { new: true }
  ).populate("author", "username avatar");

  return res.status(200).json(
    new ApiResponse(200, "Blog updated successfully", updatedBlog)
  );
});

const deleteBlog = asyncHandeler(async (req, res) => {
  const { blogId } = req.params;

  //  Validate blogId
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    throw new ApiError(400, "Invalid blog ID");
  }

  //  Find blog
  const blog = await Blog.findById(blogId);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  //  AUTHOR CHECK
  if (blog.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this blog");
  }

  //  Delete blog
  await Blog.findByIdAndDelete(blogId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Blog deleted successfully"));
});


const searchBlogs = asyncHandeler(async (req, res) => {
  const { title, author } = req.query;

  // base filter: only published blogs
  const blogFilter = {
    isPublished: true
  };

  // 🔍 title search (partial, case-insensitive)
  if (title) {
    blogFilter.title = { $regex: title, $options: "i" };
  }

  let blogsQuery = Blog.find(blogFilter)
    .populate("author", "username avatar")
    .sort({ createdAt: -1 });

  // 👤 author username search
  if (author) {
    const users = await User.find({
      username: { $regex: author, $options: "i" }
    }).select("_id");

    const userIds = users.map((u) => u._id);

    blogsQuery = blogsQuery.where("author").in(userIds);
  }

  const blogs = await blogsQuery;

  return res.status(200).json(
    new ApiResponse(200,"Search results fetched successfully", blogs)
  );
});





const getMyBlogs = asyncHandeler(async (req, res) => {
  const blogs = await Blog.find({ author: req.user._id })
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, "My blogs fetched", blogs)
  );
});



export { createBlog, getAllBlogs , getBlogById, updateBlog , deleteBlog,searchBlogs,getMyBlogs};
