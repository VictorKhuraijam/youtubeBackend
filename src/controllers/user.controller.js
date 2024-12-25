import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {deleteFromCloudinary, uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'

const options = {
  httpOnly: true,
  secure: true
}

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})//skips schema validation
    /*
    Partial Updates:
       If you're updating a single field (e.g., refreshToken) and don't want the entire document to be validated.
    Performance Optimization:
       If you trust the data integrity and want to avoid the overhead of schema validation for a small, controlled update.
    Avoiding Unintended Validation Errors:
       If some fields are temporarily invalid but irrelevant to the current operation, skipping validation ensures the document can be saved.

    */

    return {
      accessToken,
      refreshToken
    }
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating access and refresh token")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists : username, email
  // check for images, check for avatar
  // upload them to cloudinary, check upload on cloudinary
  // create user object - create entry in DB
  // remove password and refresh token field from response
  // check for user creation
  // return response

  const {fullName, email, username, password} = req.body
  // console.log("email and password:", email, password)
  /*
  console.log("req.body sends :",req.body)
  req.body sends : [Object: null prototype] {
  fullName: 'Victor Khuraijam',
  email: 'vk@vk.com',
  password: '123456789',
  username: 'chaiaurcode'
}

  */

  // if (fullName === ""){
  //   throw new ApiError(400, "fullname is required")
  // }


  // validation. can have seperate file for validation and call here like email validation etc
  //improve validation
  if(
    [fullName, email, username, password].some((field) => // some operation returns a boolean
      field?.trim() === "")
  ){
      throw new ApiError(400, "All fields are required")
  }

 //check for existence of user
 const existedUser = await User.findOne({
  $or: [{ username },{ email }]
 })

 if(existedUser){
  throw new ApiError(409, "Username or email already exists")
 }

 //check for images
 const avatarLocalPath = req.files?.avatar[0]?.path ;
 //const coverImageLocalPath = req.files?.coverImage[0]?.path ;
 //if there is no files it is returning undefined which causes error as chaining of undefined is not possible

let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
  coverImageLocalPath = req.files.coverImage[0].path
}

 if(!avatarLocalPath){
  throw new ApiError(408, "Avatar file is required")
 }

 /*
 console.log("req.files sends :",req.files)
 req.files sends : [Object: null prototype] {
  avatar: [
    {
      fieldname: 'avatar',
      originalname: 'IMG_20230323_141945.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: './public/temp',
      filename: 'IMG_20230323_141945.jpg',
      path: 'public/temp/IMG_20230323_141945.jpg',
      size: 3516645
    }
  ],
  coverImage: [
    {
      fieldname: 'coverImage',
      originalname: 'Swallowed star.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: './public/temp',
      filename: 'Swallowed star.jpg',
      path: 'public/temp/Swallowed star.jpg',
      size: 287915
    }
  ]
}
 */


 //upload on cloudinary and check if avatar is uploaded successfully
 const avatar = await uploadOnCloudinary(avatarLocalPath)
 const coverImage = await uploadOnCloudinary(coverImageLocalPath)

 if(!avatar){
   throw new ApiError(409, "Avatar file is not uploaded on cloudinary")
 }

 //create user object - DB entry
 const user = await User.create(
  {
    fullName,
    avatar :{
      url: avatar.url,
      public_id: avatar.public_id
    },
    ...(coverImage && {
      coverImage: {
        url: coverImage.url,
        public_id: coverImage.public_id
      }
    }),//keep coverImage field in db is ommitted if there is no cover image
    email,
    password,
    username : username.toLowerCase()
  }
 )

 //remove password and refresh Token from response
 const createdUser = await User.findById(user._id).select(
  '-password -refreshToken'
 )

 //check for user creation
 if(!createdUser){
  throw new ApiError(500, "Something went wrong while registering the user")
 }

 //return the response
 return res.status(201).json(
  new ApiResponse(200, createdUser , "User registered successfully")
 )


})

const loginUser = asyncHandler(async (req, res) => {
  //req body -> data
  //username or email
  //find the user
  //password check
  //access and refresh token
  //send cookie and a response that user is logged In

  const {email, username, password} = req.body

  if(!(username || email)){
    throw new ApiError(400,"Username or email is required")
  }

  const user = await User.findOne({
    $or: [{ username },{ email }]
  })

  if(!user){
    throw new ApiError(404, "User does not exits")
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password)

  if(!isPasswordCorrect){
    throw new ApiError(401, "Password is incorrect")
  }

  const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  return res
  .status(200)
  .cookie("accessToken", accessToken, options) //can be read but only accessable from server
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,
        accessToken,
        refreshToken
      },//for cases when user want to save access and refresh token on local storage etc
      "User logged in successfully"
    )
  )

})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: "" }
    },
      {
        new: true // Ensures the updated user document is returned
      }
  )



  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401, "Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if(!user){
      throw new ApiError(401, "Invalid refresh token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh Token is expired or used")
    }

    const {accessToken, newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken : newRefreshToken
        },
        "Access token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
  const {oldPassword, newPassword, confirmPassword} = req.body

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid password")
  }

  if(newPassword !== confirmPassword){
    throw new ApiError(400, "New password does not match with confirm password")
  }

  user.password = confirmPassword
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(
    new ApiResponse(200, {}, "Password changed successfully")
  )
})

const getCurrentUser = asyncHandler(async(req, res) => {
  return res
  .status(200)
  .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

//write different controller for file update. better approach as all update will result in saving text data repeatedly.

//text based data update
const updateAccountDetails = asyncHandler(async(req, res) => {
  const {fullName, email} = req.body

  if(!fullName && !email){
    throw new ApiError(400, "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email
      }
    },
    {new: true}
  ).select("-password -refreshToken")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account details updated successfully" ))

})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400, "Error while uploading on cloudinary")
  }

  const currentUser = await User.findById(req.user?._id);

  if (!currentUser) {
    throw new ApiError(404, "User not found");
  }

  // Delete the old avatar if it exists
  if (currentUser.avatar) {
    const oldAvatarPublicId =currentUser.avatar.public_id;
    if (oldAvatarPublicId) {
      await deleteFromCloudinary(oldAvatarPublicId);
    }
  }

 const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: {
          url: avatar.url,
          public_id: avatar.public_id
        }
      }
    },
    {new: true}
  ).select("-password -refreshToken")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "avatar updated successfully" ))


})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover Image file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400, "Error while uploading on cloudinary")
  }

  const currentUser = await User.findById(req.user?._id);

  if (!currentUser) {
    throw new ApiError(404, "User not found");
  }

   // Delete the old avatar if it exists
   if (currentUser.coverImage) {
    const oldCoverImagePublicId =currentUser.coverImage.public_id;
    if (oldCoverImagePublicId) {
      await deleteFromCloudinary(oldCoverImagePublicId);
    }
  }

 const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: {
          url: coverImage.url,
          public_id: coverImage.public_id
        }
      }
    },
    {new: true}
  ).select("-password -refreshToken")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Cover Image updated successfully" ))


})

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const {username} = req.params
  console.log(req.params)

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing")
  }

  const channel = await User.aggregate([
    {
      $match:{
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subcriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subcriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      }
    }
  ])
  console.log(channel)

  if (!channel.length) {
    throw new ApiError(404, "Channel does not exists")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0], "User channel fetched successfully ")
  )

})


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile
}
