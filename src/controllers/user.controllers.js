import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new MongoAPIError(
      500,
      "Something went wrong while generating access and refresh Tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //1. GET DETAILS FROM FRONTEND
  const { username, fullname, email, address, password } = req.body;

  //2. VALIDATIONS
  if (!username || !fullname || !email || !address || !password)
    throw new ApiError(400, "All fields are required");

  //3. CHECK IF THIS USER ALREADY EXISTS
  const existedUser = User.findOne({ $or: [{ username }, { email }] });
  if (existedUser)
    throw new ApiError(400, "User with this username or email already exists");

  //4. CREATE ENTRY IN DB
  const user = await User.create({
    email,
    fullname,
    password,
    username: username.toLowerCase(),
    address,
  });

  //5. REMOVING PASSWORD AND REFRESH TOKEN FROM RESPONSE
  const createdUser = await User.findById(user._id).select(
    " -password -refreshToken"
  );
  if (!createdUser)
    throw new ApiError(500, "Something wend wrong while creating new user");

  //6. RESPONSE
  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // GET DETAILS FROM FRONTEND
  const { email, username, password } = req.body;

  // VALIDATION
  if (!email || !username || !password)
    throw new ApiError(400, "All fields are required");

  // CHECK WETHER THE USER EXISTS OR NOT
  const user = User.findOne({ $or: [{ username }, { email }] });
  if (!existedUser) throw new ApiError(400, "User does not exists");

  // CHECKING PASSWORD
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");

  // ACCESS AND REFRESH TOKENS
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // SEND COOKIES
  const loggedInUser = await User.findById(user._id).select(
    " -password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  // RESPONSE
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1, // IT REMOVES REFRESH TOKEN
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookie?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized user");

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // RETRIVING TOKEN FROM USER FROM DB
    const user = User.findById(decodedToken?._id);
    if (!user) throw new ApiError(401, "Invalid refresh Token");

    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiError(401, "Refresh token has been expired");

    // GENERATING TOKENS
    const { accessToken, refreshToken: newRefreshToken } =
      generateAccessAndRefreshToken(user?._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
