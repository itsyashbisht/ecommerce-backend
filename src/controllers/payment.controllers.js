import { Order } from "../models/order.model";
import { Payment } from "../models/payment.model";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { razorpayInstance } from "../utils/razorpay.config";

// VERIFY PAYMENT.
const paymentVerification = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req?.body?.paymentInfo;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    throw new ApiError(400, "Missing payment verification data");

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
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

  // UPDATE PAYMENT RECORD
  const payment = await Payment.findOneAndUpdate(
    { razorpay_order_id },
    {
      razorpay_payment_id,
      razorpay_signature,
      status: "SUCCESS",
    },
    {
      new: true,
    }
  );
  if (!payment) throw new ApiError(404, "Payment record not found");
  const order = await Order.findOneAndUpdate({});

  return res
    .status(200)
    .json(new ApiResponse(200, payment, "Payment verified successfully"));
});

export { createRazerPayOrder, paymentVerification };
