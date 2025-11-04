import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 15,
    sortBy = "createdAt",
    sortType = "asc",
  } = req.query;

  const settingSortType = sortType === "asc" ? 1 : -1; // 1 = ascending & -1 = descending order

  const products = await Product.aggregate([
    {
      $sort: {
        [sortBy]: settingSortType,
      },
    },
    {
      $skip: parseInt((page - 1) * 10),
    },
    {
      $limit: parseInt(limit),
    },
    {
      $project: {
        createdAt: 1,
        name: 1,
        brand: 1,
        category: 1,
        description: 1,
        description: 1,
        price: 1,
        sizes: 1,
        colors: 1,
        stock: 1,
        images: 1,
      },
    },
  ]);

  if (!products)
    throw new ApiError(500, "Something went wrong while fetching products");

  return res.status(200).json(200, products, "Products fetched successfully");
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, brand, category, description, price, sizes, colors, stock } =
    req.body;
  console.log(req.body, req.files);

  if (
    !name ||
    !brand ||
    !category ||
    !description ||
    !price ||
    !sizes ||
    !colors ||
    !stock
  )
    throw new ApiError(400, "All fields are required");

  const imagesLocalPaths = req.files?.images.map((img) => img.path) || [];
  console.log(imagesLocalPaths);

  if (imagesLocalPaths.length < 2)
    throw new ApiError(400, "Atleast 2 product image is required");

  const productImages = [];

  for (let i = 0; i < imagesLocalPaths.length; i++) {
    const image = await uploadOnCloudinary(imagesLocalPaths[i]);
    productImages.push({
      public_id: image.public_id,
      url: image.url,
    });
  }
  console.log(productImages);

  if (!productImages) throw new ApiError(400, "Product images are required");

  // CREATING PRODUCT ENTRY IN DB
  const product = await Product.create({
    name,
    brand,
    category,
    description,
    price,
    sizes,
    colors,
    stock,
    images: productImages,
  });
  if (!product)
    throw new ApiError(500, "Something went wrong while creating product");

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product created successfully"));
});

const updateProductDetails = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { name, brand, category, description, price, sizes, colors, stock } =
    req.body;

  if (!productId) throw new ApiError(400, "Product Id is required in params");
  if (
    !name ||
    !brand ||
    !category ||
    !description ||
    !price ||
    !sizes ||
    !colors ||
    !stock
  )
    throw new ApiError(400, "All fields are required");

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      $set: {
        name,
        brand,
        category,
        description,
        price,
        sizes,
        colors,
        stock,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedProduct)
    throw new ApiError(
      500,
      "Something went wrong while updating product details"
    );

  return res
    .status(200)
    .json(200, updatedProduct, "Product details updated successfully");
});

const updateProductImages = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!productId) throw new ApiError(400, "Product Id is required in params");

  const imagesLocalPaths = req.files?.images.map((file) => file.path) || [];
  if (!imagesLocalPaths)
    throw new ApiError(400, "Atleast 2 product images are required");

  const updatedImagesURLs = await uploadOnCloudinary(imagesLocalPaths);
  if (!updatedImagesURLs)
    throw new ApiError(
      500,
      "Something went wrong while uploading the images to cloudinary"
    );

  const updatedImages = await Product.findByIdAndUpdate(
    productId,
    {
      $set: {
        images: updatedImagesURLs,
      },
    },
    {
      new: true,
    }
  );
  if (!updatedImages) throw new ApiError(404, "Product not found");

  return res
    .status(200)
    .json(200, updatedImages, "Product images updated successfully");
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!productId) throw new ApiError(400, "Product id is required in params");

  const deletedProduct = await Product.findByIdAndDelete(productId);
  if (!deletedProduct) throw new ApiError(404, "Product not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Successfully deleted the product"));
});

const productById = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!productId) throw new ApiError(400, "Product Id is required in params");

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

export {
  getAllProducts,
  createProduct,
  updateProductDetails,
  deleteProduct,
  updateProductImages,
  productById,
};
