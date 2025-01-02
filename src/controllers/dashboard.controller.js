import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id

    if(!userId){
      throw new ApiError(400," UserId required. Unauthorized user")
    }

    const videos = await Video.find(
      {owner: new mongoose.Types.ObjectId(userId)}
    )

    const videoIds = videos.map((video) => video._id);

    const totalVideoViews = await Video.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(userId) } }, // Filter videos by owner
      { $group: { _id: null, totalViews: { $sum: "$views" } } }   // Sum the views
    ]);

    const subscribers = await Subscription.find(
      {channel: new mongoose.Types.ObjectId(userId)}
    )

    const likes = await Like.find(
      {video: { $in: videoIds }}
    )

    /*
    // Aggregate stats
    const [videoStats, subscribers, likes] = await Promise.all([
        Video.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(userId) } }, // Filter videos by owner
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" }, // Sum views
                    totalVideos: { $sum: 1 }, // Count videos
                },
            },
        ]),
        Subscription.countDocuments({ channel: new mongoose.Types.ObjectId(userId) }), // Count subscribers
        Like.countDocuments({ video: { $in: await Video.distinct("_id", { owner: userId }) } }), // Count likes
    ]);

    // Extract stats
    const totalVideoViews = videoStats[0]?.totalViews || 0;
    const totalVideos = videoStats[0]?.totalVideos || 0;
    const totalSubscribers = subscribers || 0;
    const totalLikes = likes || 0;

    */

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
         "Total video views" : totalVideoViews[0]?.totalViews || 0,
         "Total subscribers" : subscribers?.length || 0,
         "Total videos" : videos?.length || 0 ,
         "Total likes" : likes?.length || 0
        },
        "Fetched total video views, total subscribers, total videos and total likes "
      )
    )

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const {page = 1, limit = 10} = req.query
    const userId = req.user._id

    if(!userId){
      throw new ApiError(401,"User Id required. Unauthorized user")
    }

    const pipeline = [
      { $match: { owner: userId } }, // Filter by the user owner
      { $sort: { createdAt: -1 } }, // Sort by creation date, most recent first
    ];

      // Pagination with `mongooseAggregatePaginate`
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    // Use pipeline directly with `aggregatePaginate`
    const  result = await Video.aggregatePaginate(Video.aggregate(pipeline), options);
      // Mongoose aggregation pipeline object as its first argument, not the result of Video.aggregate(...)

    return  res.status(200).json(
      new ApiResponse(
        200,
        {
          videos: result.docs, // Paginated data
          total: result.totalDocs, // Total number of matching videos
          page: result.page, // Current page
          totalPages: result.totalPages, // Total number of pages
          limit: result.limit, // Limit per page
        },
        result.docs.length > 0
        ? "Videos fetched successfully"
        : "No videos found"
      )
    );
})

export {
    getChannelStats,
    getChannelVideos
    }
