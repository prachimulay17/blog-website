import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.router.js";
import blogRouter from "./routes/blog.router.js";

const app = express();

app.use(
  cors({
    origin: "http://127.0.0.1:5500", // frontend origin
    credentials: true
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/users", userRouter); // 🔥 REQUIRED
app.use("/api/blogs", blogRouter); // 🔥 REQUIRED

export { app };
