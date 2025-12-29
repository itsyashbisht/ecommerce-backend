import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    razorpay_order_id: {
      type: String,
      required: true,
    },
    razorpay_payment_id: {
      type: String,
      required: [true, "Invalid Razorpay payment id"],
    },
    razorpay_signature: {
      type: String,
      required: [true, "Invalid Razorpay signature id"],
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
