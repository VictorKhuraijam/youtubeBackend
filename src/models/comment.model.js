import mongoose, {Schema} from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      index: true
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
      index: true
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true
    }
  },
  {timestamps: true}
);

commentSchema.plugin(aggregatePaginate)

commentSchema.pre("save", async function (next) {
  if (this.video && this.tweet) {
    throw new Error("A comment can only be associated with either a video or a tweet, not both.");
  }
  next();
});

commentSchema.pre("remove", async function (next) {
  await mongoose.model("Comment").deleteMany({ replyTo: this._id });
  next();
});//If a video, tweet, or parent comment is deleted, associated comments will be deleted.



export const Comment = mongoose.model("Comment", commentSchema)
