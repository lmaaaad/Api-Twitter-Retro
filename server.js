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
import tweetsRoutes from "./routes/tweets.js";
import imagesRoutes from "./routes/images.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

const app = express(); // init express app

/* SWAGGER CONFIG */
const swaggerDocument = YAML.load("swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/* CONFIGURATION */

const __filename = fileURLToPath(import.meta.url); //to get the current file name
const __dirname = path.dirname(__filename); // to get the current directory name
dotenv.config(); // to loads environment variables from a .env file into process.env , and we can store sensitive data there.
app.use(express.json()); // to parse incoming data into JSON
app.use(helmet()); //Sets various HTTP headers to improve security
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common")); // common is a predefined log format.
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors()); // Handles Cross-Origin Resource Sharing (CORS) headers.
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

/** ROUTES */

app.use("/auth", authRoutes); //Mounts routes defined in authRoutes under the /auth prefix.
app.use("/users", userRoutes); //Mounts routes defined in userRoutes under the /users prefix.
app.use("/tweets", tweetsRoutes); //Mounts routes defined in tweetsRoutes under the /tweets prefix.
app.use("/images", imagesRoutes);

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
