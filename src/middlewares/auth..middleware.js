import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";



export const verifyJWT = asyncHandler(async (req, _ , next) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
  // console.log(token)

  if(!token){
    throw new ApiError(401, "Unauthorized request")
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token");
  }
  //The jwt.verify function is synchronous and will throw an error if the token is invalid, expired, or cannot be verified for any other reason. Errors thrown synchronously won't be caught by the asyncHandler because asyncHandler only catches errors returned as rejected promises.

  const user = await User.findById(decodedToken._id).select("-password -refreshToken -avatar.public_id -coverImage.public_id")

  if(!user){
    //discuss about frontend
    throw new ApiError(401, "Invalid access Token")
  }

  req.user = user;
  next()

})
