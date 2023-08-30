const Mongoose = require("mongoose");
const status = require("../enums/status");
const mongoosePaginate = require("mongoose-paginate");

const options = {
  collection: "banners_application",
  timestamps: true,
};

const { Schema } = Mongoose;
const bannerSchema = new Schema(
  {
    title: { type: String },
    description: { type: String },
    url: { type: String },
    media: { type: String },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    status: { type: String, default: status.ACTIVE },
  },
  options
);
bannerSchema.plugin(mongoosePaginate);
module.exports = Mongoose.model("banner_application", bannerSchema);
