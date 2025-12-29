import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { orderItems, paymentMethod, shippingAddress } = req.body;
  let totalAmount = 0;

  // Validate shippingAddress fields
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

  if (!orderItems || orderItems.length === 0) {
    throw new ApiError(400, "No items in order");
  }
});

export { createOrder };
