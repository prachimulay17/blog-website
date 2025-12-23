import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors"

const app= express();

app.use(cors({
    origin: process.env.CORSORIGIN
    
}))

app.use(express.json({limit:"50mb"}));
app.use(express.urlencoded({limit:"50mb", extended:true}));
app.use(cookieParser());
app.use(express.static("public"));

export { app };
