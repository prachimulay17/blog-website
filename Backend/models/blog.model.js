import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3
    },

    content: {
      type: String,
      required: true
    },

    coverImage: {
      type: String,
      default: ""
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    isPublished: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const Blog = mongoose.model("Blog", blogSchema);
