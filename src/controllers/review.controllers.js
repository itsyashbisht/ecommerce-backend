import mongoose from "mongoose";
import { Review } from "../models/review.model";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";

const getProductReviewsById = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!productId) throw new ApiError(400, "Product Id is required");

  const reviews = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
      },
    },
    {
      $project: {
        comment: 1,
        rating: 1,
        user: 1,
      },
    },
  ]);

  if (!reviews) throw new ApiError(400, "No review found for this product");

  return res
    .status(200)
    .json(new ApiResponse(200, reviews, "Reviews fetched successfully"));
});

const addReview = asyncHandler(async (req, res) => {
  const { comment, rating } = req.body;
  const { productId } = req.params;
  const userId = req.user?._id;

  if (!comment || !rating)
    throw new ApiError(400, "Comment and rating fields are required");
  if (!userId) throw new ApiError(400, "User Id is required");
  if (!productId) throw new ApiError(400, "Product Id is required");

  const review = await Review.create({
    comment,
    rating,
    user: new mongoose.Types.ObjectId(userId),
    productId: new mongoose.Types.ObjectId(productId),
  });
  if (!review) throw new ApiError(500, "Failed to create review");

  return res
    .status(200)
    .json(new ApiResponse(200, review, "Review added successfully"));
});

const removeReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  if (!reviewId) throw new ApiError(400, "review Id is required");

  const review = await Review.findOneAndDelete(reviewId);
  if (!review) throw new ApiError(400, "No review found");

  return res.status(200).json(200, {}, "Review deleted successfully");
});

export { getProductReviewsById, addReview, removeReview };
