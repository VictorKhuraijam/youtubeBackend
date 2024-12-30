import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

      // Validate videoId
      if (!videoId) {
        throw new ApiError(400, "Video Id is required")
       }

    // Query for comments

        const commentPipeline = [
            {
                $match: {
                    video: videoId
                }
            },
            {
                $sort: {
                    createdAt: -1 // Sort comments by most recent
                }
            },
            {
                $lookup: {
                    from: "users", // Ensure the "users" collection name matches
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
                $project: {
                    content: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    owner: 1,
                    replyTo: 1 // Include the replyTo field
                }
            }
        ];

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        };

        const comments = await Comment.aggregatePaginate(Comment.aggregate(commentPipeline), options);

        return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            {
              success: true,
              data: comments.docs,
              currentPage: comments.page,
              totalPages: comments.totalPages,
              totalDocs: comments.totalDocs
            },
            "Video comment fetched successfully"
          )
        );


})

const getTweetComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const {tweetId} = req.params
  const {page = 1, limit = 10} = req.query

    // Validate videoId
    if (!tweetId) {
      throw new ApiError(400, "Tweet Id is required")
     }

  // Query for comments

      const tweetPipeline = [
          {
              $match: {
                  tweet: tweetId
              }
          },
          {
              $sort: {
                  createdAt: -1 // Sort comments by most recent
              }
          },
          {
              $lookup: {
                  from: "users", // Ensure the "users" collection name matches
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
              $project: {
                  content: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  owner: 1,
                  replyTo: 1 // Include the replyTo field
              }
          }
      ];

      const options = {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
      };

      const comments = await Comment.aggregatePaginate(Comment.aggregate(tweetPipeline), options);

      return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            success: true,
            data: comments.docs,
            currentPage: comments.page,
            totalPages: comments.totalPages,
            totalDocs: comments.totalDocs
          },
          "Comment for tweet fetched successfully"
        )
      );


})

const addCommentToVideo = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
  const {videoId} = req.params
  const {content, replyTo} = req.body
  const userId = req.user._id

  if(!videoId){
    throw new ApiError(400, "Video ID is required")
  }

  if(!userId){
    throw new ApiError(401, "Unauthorized user access")
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content cannot be empty.");
  }

  const newComment = await Comment.create({
    video: videoId,
    owner: userId,
    content,
    replyTo: replyTo || null
  })

  const populatedComment = await Comment.aggregate([
    { $match: { _id: newComment._id } }, // Match the newly created comment
    {
      $lookup: {
        from: "users", // The name of the user collection
        localField: "owner", // The field in the comment model
        foreignField: "_id", // The field in the user model
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
        $project: {
          content: 1,
          video: 1,
          replyTo: 1,
          createdAt: 1,
          updatedAt: 1,
          owner: 1
        },
      },
    ]);

  return res
  .status(201)
  .json(
      new ApiResponse(
          201,
          {
              success: true,
              data: populatedComment[0],
          },
          "Comment added successfully."
      )
    )
})

const addCommentToTweet =asyncHandler(async (req, res) => {
  // TODO: add a comment to a tweet
const {tweetId} = req.params
const {content, replyTo} = req.body
const userId = req.user._id

if(!tweetId){
  throw new ApiError(400, "Tweet ID is required")
}

if(!userId){
  throw new ApiError(401, "Unauthorized user access")
}

if (!content || content.trim() === "") {
  throw new ApiError(400, "Content cannot be empty.");
}

const newComment = await Comment.create({
  tweet: tweetId,
  owner: userId,
  content,
  replyTo: replyTo || null
})

const populatedComment = await Comment.aggregate([
  { $match: { _id: newComment._id } }, // Match the newly created comment
  {
    $lookup: {
      from: "users", // The name of the user collection
      localField: "owner", // The field in the comment model
      foreignField: "_id", // The field in the user model
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
      $project: {
        content: 1,
        tweet: 1,
        replyTo: 1,
        createdAt: 1,
        updatedAt: 1,
        owner: 1
      },
    },
  ]);

return res
.status(201)
.json(
    new ApiResponse(
        201,
        {
            success: true,
            data: populatedComment[0],
        },
        "Comment added successfully."
    )
  )
})


const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments,
    addCommentToVideo,
    updateComment,
    deleteComment,
    getTweetComments,
    addCommentToTweet
    }
