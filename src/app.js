import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// EXPRESS APP
const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());

// CONFIG.
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

import userRouter from "./routes/userRoutes.js";
import productRouter from "./routes/productRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import cartRouter from "./routes/cartRoutes.js";

// ROUTES.
app.use("/api/v1/user", userRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/review", reviewRouter);
app.use("/api/v1/cart", cartRouter);

export { app };
