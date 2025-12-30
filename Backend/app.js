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

// Allow multiple Netlify domains (production, preview deployments, etc.)
const allowedOrigins = [
  "https://purpleblog-prachimulay.netlify.app",
  "https://purpleblog-prachimulay.netlify.dev", // .dev domain
  "http://localhost:5500", // local development
  "http://127.0.0.1:5500",
  /^https:\/\/[a-z0-9]+\.netlify\.app$/, // any .netlify.app subdomain
  /^https:\/\/[a-z0-9\-]+\.netlify\.dev$/  // any .netlify.dev subdomain
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      // Check if origin matches any allowed pattern
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return allowedOrigin === origin;
        } else if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        console.log("CORS blocked origin:", origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// Preflight
app.options("*", cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/users", userRouter);
app.use("/api/blogs", blogRouter);

export { app };
