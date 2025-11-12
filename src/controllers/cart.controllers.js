import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { Cart } from "../models/cart.model.js";
import mongoose from "mongoose";

const getUserCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const cart = await Cart.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $project: {
        user: 1,
        size: 1,
        color: 1,
        quantity: 1,
        productDetails: 1,
      },
    },
    {
      $unwind: "$productDetails",
    },
    {
      $addFields: {
        totalPrice: {
          $multiply: ["$productDetails.price", "$quantity"],
        },
      },
    },
    {
      $group: {
        _id: "$user",
        items: {
          $push: {
            itemId: "$_id",
            productDetails: "$productDetails",
            quantity: "$quantity",
            size: "$size",
            color: "$color",
            totalPrice: "$totalPrice",
          },
        },
        grandTotal: { $sum: "$totalPrice" },
      },
    },
  ]);
  if (!cart) throw new ApiError(500, "Error while fetching cart");

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Successfully fetched user cart"));
});

const addtoCart = asyncHandler(async (req, res) => {
  const { size, color, quantity } = req.body;
  const { productId } = req.params;
  const userId = req.user?._id;

  if (!productId) throw new ApiError(400, "Product Id is required");
  if (!userId) throw new ApiError(400, "User Id is required");
  if (!size || !color || !quantity)
    throw new ApiError(400, "All fields are required");

  const cartItem = await Cart.create({
    user: new mongoose.Types.ObjectId(userId),
    product: new mongoose.Types.ObjectId(productId),
    size,
    color,
    quantity,
  });
  if (!cartItem) throw new ApiError(500, "Failed to add item to cart");

  return res
    .status(200)
    .json(new ApiResponse(200, cartItem, "Item added to cart successfully"));
});

const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!productId) throw new ApiError(400, "Product Id is required");

  const item = await Cart.findByIdAndDelete(productId);
  if (!item) throw new ApiError(404, "Item not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Item removed from cart successfully"));
});

const UpdateItemQuantity = asyncHandler(async (req, res) => {
  const itemId = req.params?.productId;
  const updatedQuantity = req.body?.quantity;
  if (!itemId) throw new ApiError(400, "Item id is required in params");

  const item = await Cart.findByIdAndUpdate(
    itemId,
    {
      $set: {
        quantity: updatedQuantity,
      },
    },
    {
      new: true,
    }
  );
  if (!item) throw new ApiError(404, "Item does not found");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        item.quantity,
        "Item's quantity updated successfully"
      )
    );
});

const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(400, "User Id is required");

  const cart = await Cart.findById(userId);
  console.log(cart);
  if (!cart) throw new ApiError("Cart doesn't found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Cart has been cleared successfully"));
});

export {
  clearCart,
  addtoCart,
  getUserCart,
  removeFromCart,
  UpdateItemQuantity,
};
