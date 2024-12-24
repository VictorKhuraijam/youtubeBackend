import mongoose, {Schema} from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true  // for optimized searching in MONGODB. Careful while placing index as it is costly and reduces performances. place only when necessary
    },
    email: {
      type: String,
      required:true,
      unique: true,
      lowecase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required:true,
      trim: true,
      index: true
    },
    avatar: {
      url: {
        type: String, // cloudinary url
        required: true,
      },
      public_id: {
        type: String, // cloudinary url
        required: true,
      }
    },
    coverImage: {
      url: {
        type: String, // cloudinary url
      },
      public_id: {
        type: String, // cloudinary url
      }
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video"
      }
    ],
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    refreshToken: {
      type: String
    }
  },
  {timestamps: true})


userSchema.pre("save", async function(next){
  if(!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password,10)
    next()
  } catch (error) {
    next(error); //pass error to Mongoose
  }
});
/*-The absence of an explicit return statement in the try block is not problematic because the purpose of the pre("save") middleware is to execute asynchronous tasks and call the next() function to signal that the middleware has finished its job.
  -Middleware functions are not meant to return a value. Instead, they use next() to inform Mongoose that the operation is complete.
*/


userSchema.methods.isPasswordCorrect = async function(password){
  return await bcrypt.compare(password, this.password) // returns true or false. compare password with the encrypted password
}

userSchema.methods.generateAccessToken = function(){
 try {
   return jwt.sign(
     {
       _id: this._id,
       email: this.email,
       username: this.username,
       fullName: this.fullName
     }, //payload
     process.env.ACCESS_TOKEN_SECRET,
     {
       expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "12h"
     }
   )
 } catch (error) {
  console.error("Error generating access token:", error.message);
  throw new Error("Could not generate access token")
 }
}

userSchema.methods.generateRefreshToken = function(){
 try {
  return jwt.sign(
     {
       _id: this._id,
     },
     process.env.REFRESH_TOKEN_SECRET,
     {
       expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "20d"
     }
   )
 } catch (error) {
  console.error("Error generating refresh token:", error.message);
  throw new Error(" Could not generate refresh token");
 }
}


export const User = mongoose.model("User", userSchema)
