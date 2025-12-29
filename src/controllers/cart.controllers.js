import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { Cart } from "../models/cart.model.js";
import mongoose from "mongoose";
import { Product } from "../models/product.model.js";

const getUserCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "User Id is Unauthorized");

  const cart = await Cart.findOne({ user: userId })
    .populate("items.product", "name price stock images")
    .sort({ updatedAt: -1 });

  if (!cart) throw new ApiError(404, "Cart not found");
  let totalAmount = 0;

  if (cart.items.length > 0) {
    for (const item of cart.items) {
      if (!item.product) continue;

      const itemTotal = item.product.price * item.quantity;
      totalAmount += itemTotal;
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: cart.items,
        totalAmount,
      },
      "Successfully fetched user cart"
    )
  );
});

const addtoCart = asyncHandler(async (req, res) => {
  const { size, color, quantity } = req.body;
  const { productId } = req.params;
  const userId = req.user?._id;

  if (!productId) throw new ApiError(400, "Product Id is required");
  if (!userId) throw new ApiError(400, "User Id is required");
  if (!size || !color || !quantity)
    throw new ApiError(400, "All fields are required");

  // CHECK PRODUCT
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(400, "Prouduct not found");

  // CHECK STOCK
  if (product.stock < quantity)
    throw new ApiError(400, "Not enough stock available");

  let cart = await Cart.findOne({ user: userId });

  // CREATE CART , IF IT ALREADY NOT EXISTS
  if (!cart) {
    cart = await Cart.create({
      user: new mongoose.Types.ObjectId(userId),
      items: [
        {
          product: new mongoose.Types.ObjectId(productId),
          size,
          color,
          quantity,
        },
      ],
    });

    return res
      .status(201)
      .json(new ApiResponse(200, cart, "Item added to cart successfully"));
  }

  // CHECK IF THE ITEM ALREADY EXISTS IN CART
  const itemIndex = cart.items.findIndex(
    (item) =>
      item.product.toString() === productId &&
      item.size === size &&
      item.color === color
  );

  // IF EXISTS, INCREASE QUANTITY
  if (itemIndex > -1) {
    const newQuantity = cart.items[itemIndex].quantity + quantity;

    if (newQuantity > product.stock)
      throw new ApiError(400, "Not enough stock available");

    cart.items[itemIndex].quantity = newQuantity;
  } else {
    cart.items.push({
      product: new mongoose.Types.ObjectId(productId),
      size,
      color,
      quantity,
    });
  }

  // SAVE CART
  const cartSaved = await cart.save();
  if (!cartSaved) throw new ApiError(500, "Failed adding items to cart");

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Item added to cart successfully"));
});

const removeProductFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "User Id is Unauthorized");
  if (!productId) throw new ApiError(400, "Product Id is required");

  // CHECK IF THE CART EXISTS
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  const updatedCart = await Cart.findOneAndUpdate(
    { user: userId },
    { $pull: { items: { product: productId } } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedCart, "Item removed from cart successfully"));
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

  const cart = await Cart.deleteMany({ user: userId });
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
