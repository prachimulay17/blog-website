import { User } from "../models/user.model.js";
import { asyncHandeler } from "../utils/async-handeler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadoncloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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

  

  // 5️⃣ Create user
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
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

  // 7️⃣ Auto-login: Generate tokens after successful registration
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  // 8️⃣ Save refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // 9️⃣ Cookie options (same as login)
  const cookieOptions = {
    httpOnly: true,
    secure: true, // 🔥 MUST be false on localhost
    path: "/",
    sameSite:"none"
  };

  // 🔟 Response with cookies set
  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(201, "User registered and logged in successfully", {
      user: {
        _id: createduser._id,
        username: createduser.username,
        email: createduser.email,
        avatar: createduser.avatar,
        bio: createduser.bio
      }
    }));
});


const loginUser = asyncHandeler(async (req, res) => {
  const { identifier, password } = req.body;

  // 1️⃣ validation
  if (!identifier || !password) {
    throw new ApiError(400, "Identifier and password are required");
  }

  // 2️⃣ find user by email or username
  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }]
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 3️⃣ check password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // 4️⃣ generate tokens
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();
if(!accessToken || !refreshToken){
  throw new ApiError(500, "Token generation failed");
}
  // 5️⃣ save refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // 6️⃣ cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: true, // 🔥 MUST be false on localhost
    path: "/",
    sameSite: "none",
    domain: ".netlify.app" // Allow all netlify.app subdomains
  };


  // 7️⃣ send response
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, "Login successful", {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio
        }
      })
    );
});


const logoutUser = asyncHandeler(async (req, res) => {
  // req.user is set by auth middleware (JWT verified)
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined }
    },
    { new: true }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true, // 🔥 MUST be false on localhost
    path: "/",
    sameSite: "none",
    domain: ".netlify.app" // Allow all netlify.app subdomains
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, "Logout successful"));
});



const refreshAccessToken = asyncHandeler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  let decodeduser;
  try {
    decodeduser = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(decodeduser._id).select("+refreshToken");

  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token expired or revoked");
  }

  // 🔁 rotate tokens
  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  const cookieOptions = {
    httpOnly: true,
    secure: true, // 🔥 MUST be false on localhost
    path: "/",
    sameSite: "none",
    domain: ".netlify.app" // Allow all netlify.app subdomains
  };

  return res
    .status(200)
    .cookie("accessToken", newAccessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(
      new ApiResponse(200, "Access token refreshed", {
        accessToken: newAccessToken
      })
    );
});

const getCurrentUser = asyncHandeler(async (req, res) => {
  console.log("REQ.USER:", req.user);

  const user = await User.findById(req.user._id)
    .select("-password -refreshToken");

  console.log("DB USER:", user);

  res.status(200).json(
    new ApiResponse(200,"User fetched", user)
  );
});


const updateUser = asyncHandeler(async (req, res) => {
  const userId = req.user._id;
  const { username, bio } = req.body;

  const updateData = {};

  // 🔹 username update
  if (username) {
    const existingUser = await User.findOne({
      username,
      _id: { $ne: userId }
    });

    if (existingUser) {
      throw new ApiError(409, "Username already taken");
    }

    updateData.username = username.toLowerCase();
  }

  // 🔹 bio update
  if (bio !== undefined) {
    updateData.bio = bio;
  }

  // 🔹 avatar update
  const avatarLocalFilePath = req.files?.avatar?.[0]?.path;
  if (avatarLocalFilePath) {
    const avatar = await uploadoncloudinary(avatarLocalFilePath);
    if (!avatar) {
      throw new ApiError(500, "Avatar upload failed");
    }
    updateData.avatar = avatar.secure_url;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true }
  ).select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, "User updated successfully", updatedUser)
  );
});


const deleteUser = asyncHandeler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const cookieOptions = {
    httpOnly: true,
    secure: true, // 🔥 MUST be false on localhost
    path: "/",
    sameSite: "none",
    domain: ".netlify.app" // Allow all netlify.app subdomains
  };


  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
      new ApiResponse(200, "User account deleted successfully")
    );
});




export { registeruser, loginUser,logoutUser, refreshAccessToken,getCurrentUser, updateUser,deleteUser};


