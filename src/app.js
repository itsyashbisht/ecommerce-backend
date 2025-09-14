import express from "express";
import cors from "cors";

// EXPRESS APP
const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// CONFIG.
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

import userRouter from "./routes/userRoutes";

app.use("/api/v1/user", userRouter);

export { app };
