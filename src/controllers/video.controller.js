import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

   // Match Stage
   const matchStage = {};
   if (query) {
     matchStage.title = { $regex: query, $options: "i" }; // Case-insensitive search
   }
   if (userId && isValidObjectId(userId)) {
     matchStage.owner = new mongoose.Types.ObjectId(userId); // Filter by userId
   }
   console.log('Match Stage:', matchStage);


  // Aggregation Pipeline
  const pipeline =
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
              videoFile: {
                url: 1
              },
              thumbnail: {
                url: 1
              },
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
              isPublished: 1,
              owner: 1,
              createdAt: 1,
          },
      },
  ];


  // Pagination with `mongooseAggregatePaginate`
  const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
  };


  try {
    // Use pipeline directly with `aggregatePaginate`
  const  result = await Video.aggregatePaginate(Video.aggregate(pipeline), options);
    // Mongoose aggregation pipeline object as its first argument, not the result of Video.aggregate(...)

    // Check if no videos are found
   if (result.docs.length === 0) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          videos: [], // Empty array for videos
          total: result.totalDocs, // Should be 0
          page: result.page, // Current page
          totalPages: result.totalPages, // Should be 0
          limit: result.limit, // Limit per page
        },
        "No videos found"
      )
    );
  }

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

  } catch (error) {
    console.error("Pagination Error:", error);
    res.status(500).json(new ApiResponse(500, null, "An error occurred during pagination"));
  }

});

const publishAVideo = asyncHandler(async (req, res) => {
 const { title, description} = req.body
 // TODO: get video, upload to cloudinary, create video

 //get a video

 const videoFileLocalPath = req.files?.videoFile[0]?.path ;
 const thumbnailLocalPath = req.files?.thumbnail[0]?.path ;

 if(!videoFileLocalPath && !thumbnailLocalPath ){
  throw new ApiError(408, "Both Video file and thumbnail is required")
 }

 //upload on cloudinary and check if video and thumbnail is uploaded successfully
 const videoFile = await uploadOnCloudinary(videoFileLocalPath)
 const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)



 if(!videoFile && !thumbnail ){
  throw new ApiError(500, "Video or thumbnail is not uploaded on cloudinary")
}

const video = await Video.create(
  {
    videoFile: {
      url: videoFile.url,
      public_id: videoFile.public_id
    },
    thumbnail: {
      url: thumbnail.url,
      public_id: thumbnail.public_id
    },
    title,
    description,
    duration: videoFile.duration,    // Duration of the video (required, from Cloudinary)
    views: 0,                 // Initial views (default: 0)
    isPublished: true,        // Set as published by default
    owner: req.user?._id,

  }
)

//remove password and refresh Token from response
const createdvideo = await Video.findById(video._id).select(
  '-videoFile.public_id -thumbnail.public_id'
 )

//check for user creation
if(!createdvideo){
  throw new ApiError(500, "Something went wrong while registering the video")
 }

 //return the response
 return res.status(201).json(
  new ApiResponse(201, createdvideo , "Video published successfully")
 )

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
