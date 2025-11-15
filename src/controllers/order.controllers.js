import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

const createOrder = asyncHandler(async (req, res) => {
  const productId = req.param?.productId;
  const {} = req.body;
});

export { createOrder };
