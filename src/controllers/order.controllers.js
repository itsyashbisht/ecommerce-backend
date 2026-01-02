import { Order } from "../models/order.model.js";
import { Payment } from "../models/payment.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { razorpayInstance } from "../utils/razorpay.config.js";

const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized user");

  const { orderItems, paymentMethod, shippingAddress } = req.body;

  // Validate business data
  if (!paymentMethod) throw new ApiError(404, "Payment method not found");
  if (!orderItems || orderItems.length === 0) {
    throw new ApiError(400, "No items in order");
  }
  if (shippingAddress) {
    const { fullname, address, city, state, pincode, phone, email } =
      shippingAddress;

    if (!fullname?.trim()) {
      throw new ApiError(400, "Full name is required");
    }
    if (!address) {
      throw new ApiError(400, "Please enter your address");
    }
    if (!city) {
      throw new ApiError(400, "Please enter your city");
    }
    if (!state) {
      throw new ApiError(400, "Please enter your state");
    }
    if (!pincode) {
      throw new ApiError(400, "Please enter your pincode");
    }
    if (!phone) {
      throw new ApiError(400, "Please enter your phone number");
    }
    if (!email) {
      throw new ApiError(400, "Please enter your email");
    }
  }

  // Calculate total amount and validate products
  let totalAmount = 0;
  const validatedOrderItems = [];

  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      throw new ApiError(404, `Product ${item.product} not found`);
    }
    if (!item.color || !product.colors.includes(item.color)) {
      throw new ApiError(400, `Invalid color for product ${product.name}`);
    }
    if (!item.size || !product.sizes.includes(item.size)) {
      throw new ApiError(400, `Invalid size for product ${product.name}`);
    }
    if (product.stock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for product ${product.name}`);
    }
    totalAmount += product.price * item.quantity;
    validatedOrderItems.push({
      product: item.product,
      quantity: item.quantity,
      price: product.price,
      color: item.color,
      size: item.size,
    });
  }

  // CREATE ORDER IN DB
  const order = await Order.create({
    user: userId,
    orderItems: validatedOrderItems,
    shippingAddress,
    paymentMethod,
    totalAmount,
    orderStatus: "CREATED",
    paymentStatus: "PENDING",
  });

  // DECIDE PAYMENT METHOD.
  if (paymentMethod === "COD") {
    // CREATE THE ORDER (COD MODE)

    return res
      .status(201)
      .json(new ApiResponse(201, order, "Order created successfully"));
  } else {
    // CREATE RAZORPAY ORDER (ONLINE METHOD)

    const options = {
      amount: totalAmount * 100, // amount in paise
      currency: "INR",
      receipt: `receipt_${order._id}`,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);
    if (!razorpayOrder) {
      throw new ApiError(500, "Failed to create Razorpay order");
    }

    // CREATE PAYMENT RECORD IN DB
    const payment = await Payment.create({
      orderId: order._id,
      amount: totalAmount,
      currency: options.currency,
      status: "PENDING",
      razorpay_order_id: razorpayOrder.id,
      recipt: razorpayOrder.receipt,
      paidAt: null,
      isVerified: false, // FOR PAYMENT VERIFICATION
    });

    if (!payment) throw new ApiError(500, "Failed to create payment record");

    // UPDATE ORDER WITH PAYMENT REFRENCE
    order.payment = payment._id;
    await order.save();

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { order, recipt: razorpayOrder.receipt, razorpayOrder },
          "Order created successfully, proceed to payment"
        )
      );
  }
});

export { createOrder };
