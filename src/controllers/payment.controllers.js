import Razorpay from "razorpay";
import crypto, { sign } from "crypto";
import fs from "fs";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { Payment } from "../models/payment.model";

const createRazerPayOrder = asyncHandler(async (req, res) => {
  // CREATE INSTANCE.
  const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  // CREATE OPTIONS.
  const { amount } = req.body;
  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  };

  // CREATE ORDER IN RAZORPAY.
  const order = await instance.orders.create(options);

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Razorpay order created successfully"));
});

const paymentVerification = asyncHandler(async (req, res) => {
  const { orderId } = req?.params;
  const { Razorpay_paymentId: paymentId, Razorpay_signature: signature } =
    req?.body?.paymentInfo;

  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString)
    .digest("hex");

  if (expectedSignature !== signature) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          {},
          "Payment verification failed: Invalid signature"
        )
      );
  }

  const payment = await Payment.findOneAndUpdate(
    { orderId },
    {
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      status: "success",
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, payment, "Payment verified successfully"));
});
