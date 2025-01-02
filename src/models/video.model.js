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
      required: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500,
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
      ref: "User",
      index: true,
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

  await mongoose.model("Like").deleteMany({ video: this._id });
  next();
});
//Deletes the comment relating to the video when the video is deleted to avoid orphaned comments

//Deletes the likes relating to the video when the video is deleted to avoid orphaned likes


export const Video = mongoose.model("Video", videoSchema)
