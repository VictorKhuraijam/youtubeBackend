import mongoose, {Schema} from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema = new Schema(
  {
    videoFile: {
      url: {
        type: String, // cloudinary url
        required: true,
      },
      public_id: {
        type: String, // cloudinary url
        required: true,
      }
    },
    thumbnail: {
      url: {
        type: String, // cloudinary url
        required: true,
      },
      public_id: {
        type: String, // cloudinary url
        required: true,
      }
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    duration: {  // will get it from cloudinary
      type: Number,
      required: true
    },
    views: {
      type: Number,
      default: 0
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
)

videoSchema.plugin(aggregatePaginate)
//Efficient handling of large datasets by splitting them into smaller, manageable chunks (pages).
//Helps implement features like "Load More" or "Next Page" in APIs.

videoSchema.pre("remove", async function (next) {
  await mongoose.model("Comment").deleteMany({ video: this._id });
  next();
});
//Deletes the comment relating to the video when the video is deleted to avoid orphaned comments

export const Video = mongoose.model("Video", videoSchema)
