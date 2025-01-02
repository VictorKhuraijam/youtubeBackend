import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const userId = req.user._id

    if(!videoId){
      throw new ApiError(400,"Video Id required")
    }

    if(!userId){
      throw new ApiError(401,"User Id required. Unauthorized user")
    }

    const likedVideo = await Like.findOne({
      video: videoId,
      likedBy: userId
    })

    if(likedVideo ){
      await likedVideo.deleteOne()
      return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            like: false
          },
          "Video unliked"
        )
      )
    }

    await Like.create(
        {
          video: videoId,
          likedBy: userId
        }
      )

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          like: true
        },
        " Video liked"
      )
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const userId = req.user._id

    if(!commentId){
      throw new ApiError(400,"Comment Id required")
    }

    if(!userId){
      throw new ApiError(401,"User Id required. Unauthorized user")
    }

    const likedComment = await Like.findOne({
      comment: commentId,
      likedBy: userId
    })

    if(likedComment ){
      await likedComment.deleteOne()
      return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            like: false
          },
          "Comment unliked"
        )
      )
    }

    await Like.create(
        {
          comment: commentId,
          likedBy: userId
        }
      )

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          like: true
        },
        " Comment liked"
      )
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

      const userId = req.user._id

      if(!tweetId){
        throw new ApiError(400,"Tweet Id required")
      }

      if(!userId){
        throw new ApiError(401,"User Id required. Unauthorized user")
      }

      const likedTweet = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
      })

      if(likedTweet ){
        await likedTweet.deleteOne()
        return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            {
              like: false
            },
            "Tweet unliked"
          )
        )
      }

      await Like.create(
          {
            tweet: tweetId,
            likedBy: userId
          }
        )

      return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            like: true
          },
          " Tweet liked"
        )
      )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id

    if(!userId){
      throw new ApiError(400,"User Id required")
    }

    const likedVideos = await Like.find(
      { likedBy: userId, video: { $exists: true } }, // Query to match liked videos by the user
      { video: 1, _id: 0 } // Projection to include only 'video' field in the result
    ).populate("video")

    if (!likedVideos.length) {
      return res.status(404).json(
        new ApiResponse(
          404,
          [],
          "No liked videos found for the user."
        )
      );
    }

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likedVideos,
        "Liked videos retrieved successfully"
      )
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
