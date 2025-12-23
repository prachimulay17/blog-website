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

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // 🔗 relation
      required: true
    },

    coverImage: {
      type: String, // Cloudinary URL
      default: ""
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published"
    },

    views: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const Blog = mongoose.model("Blog", blogSchema);
