import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const razorpay_order_id = "order_RzSg5TXdcIHWIX";
const razorpay_payment_id = "pay_test_001";

const body = razorpay_order_id + "|" + razorpay_payment_id;

console.log("BODY STRING:", body);
console.log("SECRET:", process.env.RAZORPAY_KEY_SECRET);

const signature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
  .update(body)
  .digest("hex");

console.log("GENERATED SIGNATURE:", signature);
