import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import { asyncHandeler } from "../utils/async-handeler.js";
import dotenv from "dotenv";

dotenv.config();

export const verifyJWT = asyncHandeler(async (req, res, next) => {
  const token = req.cookies?.accessToken;
 


  if (!token) {
    throw new ApiError(401, "Unauthorized: No token provided");
  }

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  // ✅ decoded must contain _id
  req.user = decoded;

  next();
});
