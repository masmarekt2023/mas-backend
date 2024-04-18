const Mongoose = require("mongoose");
const status = require("../enums/status");
const mongoosePaginate = require("mongoose-paginate");

const options = {
  collection: "purchases",
  timestamps: true,
};

const {Schema} = Mongoose;
const schemaDefination = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    nft1Id: {
      type: Schema.Types.ObjectId,
      ref: "nft1",
    },
    title: { type: String },
    name: { type: String },
    description: { type: String },
    validTillDate: { type: Date },
    masPrice: { type: String },
    fees: { type: String },
    isAlert: { type: Boolean, default: false },
    purchasesStatus: {
      type: String,
      enum: [status.ACTIVE, status.EXPIRED],
      default: status.ACTIVE,
    },
    status: { type: String, default: status.ACTIVE },
  },
  options
);

schemaDefination.plugin(mongoosePaginate);

module.exports = Mongoose.model("purchases", schemaDefination);
