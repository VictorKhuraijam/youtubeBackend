import mongoose, {Schema} from "mongoose";


const tweetSchema = new Schema(
  {
    content: {
      type: String,
      required: true
    },
    Owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {timestamps: true}
)

tweetSchema.pre("remove", async function (next) {
  await mongoose.model("Comment").deleteMany({ tweet: this._id });
  next();
});
//Deletes the comment relating to the tweet when the tweet is deleted to avoid orphaned comments


export const Tweet = mongoose.model("Tweet", tweetSchema)
