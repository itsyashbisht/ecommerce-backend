import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
        price: {
          type: Number,
          required: [true, "Price of the product is required"],
        },
      },
    ],

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

    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      required: true,
    },
    paymentInfo: {
      razorpay_order_id: String,
      razorpay_payment_id: String,
      razorpay_signature: String,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    orderStatus: {
      type: String,
      enum: [
        "CREATED",
        "PROCESSING",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "CREATED",
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAt: Date,
    deliverAt: Date,
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model("Order", orderSchema);
