import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { createBrotliCompress } from "zlib";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRouter.js";
import tweetsRoutes from "./routes/tweets.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { Server } from "socket.io";

const app = express(); // init express app
/* SWAGGER CONFIG */
const swaggerDocument = YAML.load("swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/* CONFIGURATION */

const __filename = fileURLToPath(import.meta.url); //to get the current file name
export const __dirname = path.dirname(__filename); // to get the current directory name
dotenv.config(); // to loads environment variables from a .env file into process.env , and we can store sensitive data there.
app.use(express.json()); // to parse incoming data into JSON
app.use(helmet()); //Sets various HTTP headers to improve security
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("tiny")); // common is a predefined log format.
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors()); // Handles Cross-Origin Resource Sharing (CORS) headers.
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

/* FILE STORAGE */

 //Defines a route for handling user registration.
//It expects a single file upload with the field name "pictures" and calls the register function.
/** ROUTES */

app.use("/auth", authRoutes); //Mounts routes defined in authRoutes under the /auth prefix.
app.use("/users", userRoutes); //Mounts routes defined in userRoutes under the /users prefix.
app.use("/tweets", tweetsRoutes); //Mounts routes defined in tweetsRoutes under the /tweets prefix.
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001; //6001 is the backup port
mongoose
  .connect(process.env.MONGO_URL, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => console.log("server port: " + PORT));
  })
  .catch((error) => console.log("${error} did not connect "));

