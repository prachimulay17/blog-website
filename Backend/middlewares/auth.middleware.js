import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandeler } from "../utils/async-handeler.js";

export const verifyJWT = asyncHandeler(async (req, res, next) => {
  // Only check cookies for httpOnly tokens - NEVER check req.body for security
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(401, "Unauthorized: No access token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // ✅ decoded must contain _id
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, "Access token expired");
    } else if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, "Invalid access token");
    } else {
      throw new ApiError(401, "Token verification failed");
    }
  }
});
