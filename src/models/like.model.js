import mongoose, {Schema} from "mongoose";
import { ApiError } from "../utils/ApiError";


const likeSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      index: true,
      default: null
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      index: true,
      default: null
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
      index: true,
      default: null
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
  },
  {timestamps: true}
);

// Custom validation to ensure only one entity type is liked
likeSchema.pre("save", function (next) {
  const entityFields = [this.video, this.comment, this.tweet];
  const populatedFields = entityFields.filter((field) => field !== null);
  //filter function a new array with only the elements that passed the test
  if (populatedFields.length !== 1) {
    return next(
      new ApiError(400,"A like must reference exactly one entity (video, comment, or tweet).")
    );
  }

  next();
});

export const Like = mongoose.model("Like", likeSchema)
