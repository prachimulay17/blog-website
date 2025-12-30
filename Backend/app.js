import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.router.js";
import blogRouter from "./routes/blog.router.js";

const app = express();

// 🔥 MUST be first (before cookieParser & cors)
app.set("trust proxy", 1);

// Middleware
app.use(cookieParser());

app.use(
  cors({
    origin: "https://purpleblog-prachimulay.netlify.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);



app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/users", userRouter);
app.use("/api/blogs", blogRouter);

export { app };
