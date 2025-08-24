import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    items: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model("Order", orderSchema);
