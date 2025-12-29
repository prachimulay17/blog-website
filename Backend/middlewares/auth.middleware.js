import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandeler } from "../utils/async-handeler.js";
import dotenv from "dotenv";

dotenv.config();

console.log("Cookies received:", req.cookies);

export const verifyJWT = asyncHandeler(async (req, res, next) => {
  const token = req.cookies?.accessToken||req.body?.accessToken;
 
  if (!token) {
    throw new ApiError(401, "Unauthorized: No token provided");
  }

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  // ✅ decoded must contain _id
  req.user = decoded;

  next();
});
