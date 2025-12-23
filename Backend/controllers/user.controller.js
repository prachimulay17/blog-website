import { User } from "../models/user.model.js";
import { asyncHandeler } from "../utils/async-handeler.js";
import { ApiError } from "../utils/apiError.js";
import { uploadoncloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import bcrypt from "bcrypt";

const registeruser = asyncHandeler(async (req, res) => {
  const { username, email, password, bio } = req.body;

  // 1️⃣ Validation
  if (!username || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  // 2️⃣ Check existing user
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists with this email or username");
  }

  // 3️⃣ Avatar upload
  let avatarUrl = "";
  const avatarLocalFilePath = req.files?.avatar?.[0]?.path;

  if (avatarLocalFilePath) {
    const avatar = await uploadoncloudinary(avatarLocalFilePath);

    if (!avatar) {
      throw new ApiError(
        500,
        "Unable to upload avatar image, please try again later"
      );
    }

    avatarUrl = avatar.secure_url;
  }

  // 4️⃣ Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 5️⃣ Create user
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password: hashedPassword,
    avatar: avatarUrl,
    bio: bio || ""
  });

  // 6️⃣ Remove sensitive fields
  const createduser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createduser) {
    throw new ApiError(
      500,
      "User registration failed, please try again later"
    );
  }

  // 7️⃣ Response
  return res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", createduser));
});

export { registeruser };


