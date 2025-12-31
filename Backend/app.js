import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.router.js";
import blogRouter from "./routes/blog.router.js";

const app = express();

const allowedOrigins = [
  "http://127.0.0.1:5501",
  "http://localhost:5501",
  "http://localhost:3000",
  "https://purpleblog-prachimulay.netlify.app" // keep for later
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser tools like Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  })
);




app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/users", userRouter);
app.use("/api/blogs", blogRouter);

export { app };
