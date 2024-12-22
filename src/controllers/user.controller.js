import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'


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
  console.log("email and password:", email, password)

  // if (fullName === ""){
  //   throw new ApiError(400, "fullname is required")
  // }


  // validation. can have seperate file for validation and call here like email validation etc
  //improve validation
  if(
    [fullName, email, username, password].some((field) =>
      field?.trim() === "")
  ){
      throw new ApiError(400, "All fields are required")
  }

 //check for existence of user
 const existedUser = User.findOne({
  $or: [{ username },{ email }]
 })

 if(existedUser){
  throw new ApiError(409, "Username or email already exists")
 }

 //check for images
 const avatarLocalPath = req.files?.avatar[0]?.path ;
 const coverImageLocalPath = req.files?.coverImage[0]?.path ;

 if(!avatarLocalPath){
  throw new ApiError(408, "Avatar file is required")
 }

 //upload on cloudinary and check if avatar is uploaded successfully
 const avatar = await uploadOnCloudinary(avatarLocalPath)
 const coverImage = await uploadOnCloudinary(coverImageLocalPath)

 if(!avatar){
   throw new ApiError(409, "Avatar file is required")
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


export {registerUser}
