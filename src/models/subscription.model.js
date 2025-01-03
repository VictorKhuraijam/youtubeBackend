import mongoose, {Schema} from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const subcriptionSchema = new Schema(
  {
    subscriber:{
      type: Schema.Types.ObjectId, //one who is subscribing
      ref: "User",
      index: true
    },
    channel: {
      type: Schema.Types.ObjectId, //one to whom subscriber is subscribing
      ref: "User",
      index: true
    }
  },
  {timestamps: true}
);


subcriptionSchema.plugin(aggregatePaginate)

export const Subscription = mongoose.model("Subscription", subcriptionSchema)
