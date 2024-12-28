import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  // Validate input
  if (!query && !userId) {
    throw new ApiError(400, "Either 'query' or 'userId' must be provided");
  }

   // Match Stage
   const matchStage = {};
   if (query) {
     matchStage.title = { $regex: query, $options: "i" }; // Case-insensitive search
   }
   if (userId) {
     matchStage.owner = new mongoose.Types.ObjectId(userId); // Filter by userId
   }

  // Aggregation Pipeline
  const video = await Video.aggregate(
    [
      {
        $match:  matchStage // Filters
      },
      {
          $lookup: {
              from: "users", // User collection
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                  {
                      $project: {
                          fullName: 1,
                          username: 1,
                          avatar: {
                            url: 1
                          },
                      },
                  },
              ],
          },
      },
      { $addFields: { owner: { $first: "$owner" } } }, // Flatten owner array
      {
        $sort: sortBy
        ? { [sortBy]: sortType === "desc" ? -1 : 1 }
        : { createdAt: -1 }, // Default sorting
      }, 
      {
          $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
              isPublished: 1,
              owner: 1,
              createdAt: 1,
          },
      },
  ]);

  // Pagination with `mongooseAggregatePaginate`
  const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
  };

  const result = await Video.aggregatePaginate(video, options);


  res.status(200).json(
    new ApiResponse(
      200,
      {
        videos: result.docs, // Paginated data
        total: result.totalDocs, // Total number of matching videos
        page: result.page, // Current page
        totalPages: result.totalPages, // Total number of pages
        limit: result.limit, // Limit per page
    },
    "Videos fetched successfully"
    )
  );
});




const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
