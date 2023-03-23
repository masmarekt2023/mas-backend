const Mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");

const options = {
  collection: "story",
  timestamps: true,
};

const { Schema } = Mongoose;

const storyModel = new Schema({
  userId: { type: String },
  url: { type: String },
  type: { type: String },
}, options);

storyModel.plugin(mongoosePaginate);
storyModel.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("story", storyModel);
