import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const userId = req.user._id

    if(!channelId){
        throw new ApiError(400, "Channel Id required")
    }

    if(!userId){
        throw new ApiError(401,"UserId unavailable, unauthorized user entry")
    }

    // Prevent self-subscription
    if (userId.toString() === channelId.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const existingSubsription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })

    if(existingSubsription){
       await existingSubsription.deleteOne()
       return res
       .status(200)
       .json(
        new ApiResponse(
            200,
            {
                subcriber: false
            },
            "User unsubscribed"
        )
       )
    } else {
         await Subscription.create(
            {
                subscriber: userId,
                channel: channelId
            }
        )
        return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {
                    subscriber: true
                },
                "User is subscribed"
            )
        )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {page = 1, limit = 10} = req.query
    const {channelId} = req.params
    const userId = req.user._id

    if(!channelId){
        throw new ApiError(400, "Channel Id required")
    }

    if(!userId){
        throw new ApiError(401,"UserId unavailable, unauthorized user entry")
    }

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    const pipeline = [
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from: "users", // The name of the user collection
                localField: "subscriber", // The field in the subscription model
                foreignField: "_id", // The field in the user model
                as: "subscribers",
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
            }
        },
        {
         $addFields: {
             subscribersCount: {
                $size: "$subscribers"
              },
          },
        },
        /*
        {
            $group: {
                _id: "$channel", // Group by channel ID
                subscribers: { $push: { $arrayElemAt: ["$subscribers", 0] } }, // Flatten the subscribers array
                subscribersCount: { $sum: 1 } // Count the number of subscribers
            } // for one line subscriber count and an array of subscribers
         },
        */
        {
            $project: {
                subscribers: 1,
                subscribersCount: 1
            }
        }
    ]

    const options = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
            };

    const subscriptions = await Subscription.aggregatePaginate(Subscription.aggregate(pipeline), options);

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          success: true,
          data: subscriptions.docs,
          currentPage: subscriptions.page,
          totalPages: subscriptions.totalPages,
          totalDocs: subscriptions.totalDocs
        },
        subscriptions.docs.length === 0 ? "No subscribers yet"
        : "subscriptions fetched successfully"
      )
    );
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const {page = 1, limit = 10} = req.query
    const userId = req.user._id

    if(!subscriberId){
        throw new ApiError(400, "Subscribed Id required")
    }

    if(!userId){
        throw new ApiError(401,"UserId unavailable, unauthorized user entry")
    }

    if (!mongoose.isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    const pipeline = [
        {
            $match: {
                channel: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from: "users", // The name of the user collection
                localField: "channel", // The field in the subscription model
                foreignField: "_id", // The field in the user model
                as: "subscribedTo",
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
            }
        },
        // {
        //  $addFields: {
        //      subscribedToCount: {
        //         $size: "$subscribedTo"
        //       },
        //   },
        // },

        {
            $group: {
                _id: "$subscriber", // Group by subscriber ID
                subscribedTo: { $push: "$channel" }, // Flatten the channel array
                subscribedToCount: { $sum: 1 } // Count the number of channel
            } // for one line subscribedTo count and an array of channel
        },
        {
            $project: {
                subscribedTo: 1,
                subscribedToCount: 1
            }
        }
    ]

    const options = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
            };

    const subscribedTo = await Subscription.aggregatePaginate(Subscription.aggregate(pipeline), options);

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          success: true,
          data: subscribedTo.docs,
          currentPage: subscribedTo.page,
          totalPages: subscribedTo.totalPages,
          totalDocs: subscribedTo.totalDocs
        },
        "Subscribed channel fetched successfully"
      )
    );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
