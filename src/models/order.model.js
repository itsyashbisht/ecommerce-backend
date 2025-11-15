import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          required: [true, "Please enter quantity of the product"],
        },
      },
    ],
    amount: {
      type: Number,
      required: true,
    },
    paymentInfo: {
      razorpay_order_id: {
        type: String,
        required: [true, "Invalid Razorpay Order ID"],
      },
      razorpay_payment_id: {
        type: String,
        required: [true, "Invalid Razorpay Payment ID"],
      },
      razorpay_signature: {
        type: String,
        required: [true, "Invalid Razorpay Signature"],
      },
    },
    paymentStatus: {
      // PENDING || PAID || FAILED || REFUND
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: ["Processing", "Out For Delivery", "Delivered", "Cancelled"],
      default: "Processing",
    },
    shippingAddress: {
      type: {
        fullname: {
          type: String,
          required: true,
          trim: true,
        },
        address: {
          type: String,
          required: [true, "Please enter your address"],
        },
        city: {
          type: String,
          required: [true, "Please enter your city"],
        },
        state: {
          type: String,
          required: [true, "Please enter your state"],
        },
        pincode: {
          type: String,
          required: [true, "Please enter your pincode"],
        },
        phone: {
          type: String,
          required: [true, "Please enter your phone number"],
        },
        email: {
          type: String,
          required: [true, "Please enter your email"],
        },
      },
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model("Order", orderSchema);
