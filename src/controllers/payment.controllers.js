import mongoose from "mongoose";
import crypto from "crypto";
import { Order } from "../models/order.model.js";
import { Payment } from "../models/payment.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * PAYMENT FLOW (DO NOT MODIFY CASUALLY)
 * - createOrder: creates order + payment intent
 * - verifyPayment: verifies signature & updates order atomically
 * - Uses MongoDB transactions for consistency
 */

// VERIFY PAYMENT.
const paymentVerification = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req?.body?.paymentInfo;

  console.log("body:", req.body);

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    throw new ApiError(400, "Missing payment verification data");

  // START SESSION (I.E  CREATING A ISOLATED DB CONTEXT)
  const session = await mongoose.startSession();
  session.startTransaction(); // THIS TELLS MONGO-DB TO GROUP THE NEXT OPERATIONS.

  try {
    const payment = await Payment.findOne({ razorpay_order_id }).session(
      session
    ); // ENSURES READ/WRITE CONSISTENCY
    if (!payment) throw new ApiError(404, "Payment not found");

    // CHECK WHETHER THE PAYMENT IS ALREADY BEEN VERIFIED.
    if (payment.status === "SUCCESS") {
      await session.commitTransaction(); // MAKE CHANGES PERMANENT.
      session.endSession();

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Payment already verified"));
    }

    //ELSE -> RAZORPAY GENERATE SIGNATURE RULE.
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    console.log("BACKEND BODY:", razorpay_order_id + "|" + razorpay_payment_id);
    console.log("EXPECTED:", expectedSignature);
    console.log("RECEIVED:", razorpay_signature);

    if (expectedSignature !== razorpay_signature) {
      payment.status = "FAILED";
      payment.failureReason = "Invalid signature";
      await payment.save({ session });

      throw new ApiError(400, "Payment verification failed, Invalid signature");
    }

    // IF SIGNATURE VALID -> UPDATE PAYMENT.
    payment.status = "SUCCESS";
    payment.razorpay_payment_id = razorpay_payment_id;
    payment.razorpay_signature = razorpay_signature;
    payment.isVerified = true;
    payment.paidAt = new Date();

    // UPDATING DOCU. IN DB.
    await payment.save({ session });

    // UPDATE ORDER.
    const order = await Order.findById(payment.orderId).session(session);
    if (!order) throw new ApiError(404, "Order not found to update.");

    const paidAt = payment.paidAt;
    const deliverAt = new Date(paidAt);
    deliverAt.setDate(deliverAt.getDate() + 7);

    order.paymentStatus = "PAID";
    order.paidAt = paidAt;
    order.deliverAt = deliverAt;
    order.orderStatus = "PROCESSING";

    await order.save({ session });

    // COMMIT
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orderId: order._id,
          recipt: payment.recipt,
        },
        "Payment verified successfully"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// TODO: Enable & test Razorpay webhooks before production
const razorpayWebhook = asyncHandler(async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const signature = req.headers["x-razorpay-signature"];

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Invalid webhook signature"));
  }

  // PARSE WEBHOOK EVENT.
  const event = JSON.parse(req.body.toString());

  // HANDLE PAYMENT-CAPTURED.
  if (event.event === "payment.captured") {
    const razorpay_order_id = event.payload.payment.entity.order_id;
    const razorpay_payment_id = event.payload.payment.entity.id;

    const payment = await Payment.findOne({ razorpay_order_id });

    if (!payment)
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Payment record not found, ignoring"));

    // CHECK PAYMENT STATUS.
    if (payment.status === "SUCCESS") {
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Payment already processed"));
    }

    // ELSE -> UPDATE PAYMENT.
    payment.status = "SUCCESS";
    payment.razorpay_payment_id = razorpay_payment_id;
    payment.isVerified = true;
    payment.paidAt = new Date();
    await payment.save();

    // UPDATE ORDER.
    const order = await Order.findById(payment.orderId);

    if (order) {
      const paidAt = payment.paidAt;
      const deliverAt = new Date(paidAt);
      deliverAt.setDate(deliverAt.getDate() + 7);

      order.paymentStatus = "PAID";
      order.paidAt = paidAt;
      order.deliverAt = deliverAt;
      order.orderStatus = "PROCESSING";

      await order.save();
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Payment captured handled successfully"));
  }

  // HANDLE PAYMENT-FAILED.
  if (event.event === "payment.failed") {
    const razorpay_order_id = event.payload.payment.entity.order_id;

    const payment = await Payment.findOne({ razorpay_order_id });

    if (payment) {
      payment.status = "FAILED";
      payment.faliureReason = event.payload.payment.entity.error_description;

      await payment.save();
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Payment failed handled successfully"));
  }

  // IGNORE OTHER EVENTS SAFELY
  return res.status(200).json(new ApiResponse(200, {}, "Event ignored"));
});

export { paymentVerification, razorpayWebhook };
