
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const userId = req.user._id
    const {content} = req.body

    if(!userId){
      throw new ApiError(401, "Unauthorized access")
    }

    if(!content || content.trim() === ""){
      throw new ApiError(400, "Tweet content cannot be empty")
    }

    if (content.length > 300) {
      throw new ApiError(400, "Tweet content cannot exceed 300 characters");
    }

    const newTweet = await Tweet.create({
      content,
      owner: userId
    })
    //no need to check if newTweet created as if creation fails, it will throw error by default

    return res
    .status(201)
    .json(new ApiResponse(
      201,
      {
        success: true,
        data: newTweet
      },
      "A new Tweet has been  created"
    ))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {page = 1, limit = 10, sortBy = "createdAt", sortType = "desc"} = req.query
    const userId = req.user._id

    if(!userId){
      throw new ApiError(401, "User ID required")
    }

    const pipeline = [
      {
        $match: {owner: userId}
      },
      {
          $lookup: {
            from: "users", // Name of the User collection
            localField: "owner",
            foreignField: "_id",
            as: "userDetails",
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
            ]
        },
      },
      { $addFields: { userDetails: { $first: "$userDetails" } } }, // Flatten owner array
      {
        $sort: sortBy
        ? { [sortBy]: sortType === "desc" ? -1 : 1 }
        : { createdAt: -1 }, // Default sorting
      },
      {
        $project: {
          content: 1,
          userDetails: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    }

    try {
        // Use pipeline directly with `aggregatePaginate`
      const  result = await Tweet.aggregatePaginate(Tweet.aggregate(pipeline), options);
        // Mongoose aggregation pipeline object as its first argument, not the result of Video.aggregate(...)

        // Check if no videos are found
       if (result.docs.length === 0) {
        return res.status(200).json(
          new ApiResponse(
            200,
            {
              tweets: [], // Empty array if no tweets are found
              total: result.totalDocs, // Should be 0
              page: result.page, // Current page
              totalPages: result.totalPages, // Should be 0
              limit: result.limit, // Limit per page
            },
            "No Tweet found"
          )
        );
      }

      return  res.status(200).json(
        new ApiResponse(
          200,
          {
            tweets: result.docs, // Paginated data
            total: result.totalDocs, // Total number of matching tweets
            page: result.page, // Current page
            totalPages: result.totalPages, // Total number of pages
            limit: result.limit, // Limit per page
          },
          "Tweets fetched successfully"
        )
      );

      } catch (error) {
        console.error("Pagination Error:", error);
        res.status(500).json(new ApiResponse(500, null, "An error occurred during pagination"));
    }

})

const getAllTweets = asyncHandler(async (req, res) => {

  const {page = 1, limit = 10, sortBy = "createdAt", sortType = "desc"} = req.query

  const pipeline = [
        {
          $lookup: {
            from: "users", // Name of the User collection
            localField: "owner",
            foreignField: "_id",
            as: "userDetails",
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
            ]
        },
      },
      { $addFields: { userDetails: { $first: "$userDetails" } } }, // Flatten owner array
      {
        $sort: sortBy
        ? { [sortBy]: sortType === "desc" ? -1 : 1 }
        : { createdAt: -1 }, // Default sorting
      },
      {
        $project: {
          content: 1,
          userDetails: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
  ]

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  }


  try {
    const result = await Tweet.aggregatePaginate(Tweet.aggregate(pipeline), options);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          tweets: result.docs,
          total: result.totalDocs,
          page: result.page,
          totalPages: result.totalPages,
          limit: result.limit,
        },
        "Tweets fetched successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching tweets:", error);
    return res.status(500).json(
      new ApiResponse(500, null, "An error occurred while fetching tweets")
    );
  }

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body
    const userId = req.user._id

    if(!tweetId){
      throw new ApiError(400, "Tweet Id is required")
    }

    if(!userId){
      throw new ApiError(401, "Unauthorized access")
    }

    if (!content || content.trim() === "") {
      throw new ApiError(400, "Content is required and cannot be empty");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== userId.toString()) {
      throw new ApiError(403, "You are not authorized to update this tweet");
    }

    const updateTweet = await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $set: {
          content
        }
      },
      {new:true}
    )

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updateTweet,
        "Tweet updated successfully"
      )
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    const userId = req.user._id

    if(!tweetId){
      throw new ApiError(400, "Tweet Id is required")
    }

    if(!userId){
      throw new ApiError(401, "Unauthorized access")
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== userId.toString()) {
      throw new ApiError(403, "You are not authorized to update this tweet");
    }

    await tweet.deleteOne()

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          success: true,
          data: null
        },
        "Tweet successfully deleted"
      )
    )
})

export {
    getAllTweets,
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
