import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // explicitly point t0o the .env file
import connectdb from "./db/index.js";




connectdb()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log("Server running on:", process.env.PORT || 8000);
    });
  })
  .catch((error) => {
    console.log("Connection with database failed:", error);
  });
import { app } from "./app.js";