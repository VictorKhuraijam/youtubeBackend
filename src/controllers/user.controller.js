import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'



const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})

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
    avatar : avatar.url,
    coverImage : coverImage?.url || "",
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

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("AccessToken", accessToken, options) //can be read but only accessable from server
  .cookie("RefreshToken", refreshToken, options)
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
      $set: {
        refreshToken: undefined
      }
    },
      {
        new: true
      }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})


export {
  registerUser,
  loginUser,
  logoutUser
}
