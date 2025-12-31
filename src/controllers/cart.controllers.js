import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/apiError.js";
import { Cart } from "../models/cart.model.js";
import mongoose from "mongoose";

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
  const { color, size } = req.body;
  const userId = req.user?._id;
  if (!color || !size)
    throw new ApiError(
      400,
      "Color and size are required to identify the item to remove"
    );
  if (!productId) throw new ApiError(400, "Product Id is required");
  if (!userId) throw new ApiError(401, "User Id is Unauthorized");

  // CHECK IF THE CART EXISTS
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  const itemIndex = cart.items.findIndex(
    (item) =>
      item.product.toString() === productId &&
      item.size === size &&
      item.color === color
  );

  if (itemIndex === -1) throw new ApiError(404, "Product not found");
  // splice(start,no. of elements)
  const removedEl = cart.items.splice(itemIndex, 1);

  if (!removedEl || removedEl.length === 0)
    throw new ApiError(500, "Failed to remove item from cart");

  const cartSaved = await cart.save();
  if (!cartSaved) throw new ApiError(500, "Failed to save cart after removal");

  return res
    .status(200)
    .json(
      new ApiResponse(200, removedEl, "Item removed from cart successfully")
    );
});

const UpdateItemQuantity = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const productId = req.params?.productId;
  const { quantity: updatedQuantity, size, color } = req.body;

  if (!updatedQuantity || !size || !color)
    throw new ApiError(400, "All fields are required");
  if (!productId) throw new ApiError(400, "Item id is required in params");
  if (!userId) throw new ApiError(401, "User Id is Unauthorized");

  const product = await Product.findOne({ _id: productId });
  if (!product) throw new ApiError(400, "Product doesn't found");

  if (product.stock < updatedQuantity)
    throw new ApiError(400, "Not enough stock available");

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(400, "Cart doesn't found");

  const itemIndex = cart.items.findIndex(
    (item) =>
      item.product.toString() === productId &&
      item.size === size &&
      item.color === color
  );

  if (itemIndex !== -1) {
    cart.items[itemIndex].quantity = updatedQuantity;
  } else {
    throw new ApiError(400, "No product found");
  }

  const updatedCart = await cart.save();
  if (!updatedCart) throw new ApiError(500, "Failed to update item quantity");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedCart.items[itemIndex],
        "Item's quantity updated successfully"
      )
    );
});

const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(400, "User Id is required");

  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        items: [],
      },
    },
    {
      new: true,
    }
  );
  console.log(cart);
  if (!cart) throw new ApiError("Cart doesn't found");

  return res
    .status(200)
    .json(
      new ApiResponse(200, cart, "Your cart has been cleared successfully")
    );
});

export {
  clearCart,
  addtoCart,
  getUserCart,
  removeProductFromCart,
  UpdateItemQuantity,
};
