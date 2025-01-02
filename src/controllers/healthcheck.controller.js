import mongoose from 'mongoose'
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
     // Check MongoDB connection status
  const mongoStatus = mongoose.connection.readyState;

  if (mongoStatus === 1) {  // 1 means connected
    // If MongoDB is connected, return OK status
    return res.status(200).json(
      new ApiResponse(
         200,
         {
           status: 'OK'
         },
         "Service is running smoothly")
    );
  } else {
    // If MongoDB is not connected, return error
    throw new ApiError(503, "MongoDB is not connected");
  }
})

export {
    healthcheck
    }
