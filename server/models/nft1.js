const Mongoose = require("mongoose");
const status = require("../enums/status");
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const options = {
  collection: "nft1",
  timestamps: true,
};

const { Schema } = Mongoose;
const schemaDefination = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    orderId: [
      {
        type: Schema.Types.ObjectId,
        ref: "order",
      },
    ],
    bidId: [
      {
        type: Schema.Types.ObjectId,
        ref: "bid",
      },
    ],
    subscribers: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    likesUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    itemId: [
      {
        type: Schema.Types.ObjectId,
        ref: "nft1",
      },
    ],
    itemTitle: {
      type: String,
    },
    itemName: {
      type: String,
    },
    donationAmount: {
      type: String,
    },
    coinName: {
      type: String,
    },
    duration: {
      type: String,
    },
    expiryTime: {
      type: String,
    },
    
    mediaUrl1: { type: String },
    mediaUrl2: { type: String },
    mediaUrl3: { type: String },
    mediaUrl4: { type: String },
    mediaUrl5: { type: String },
    mediaUrl6: { type: String },
    mediaUrl7: { type: String },
    mediaUrl8: { type: String },
    mediaUrl9: { type: String },

    details: {
      type: String,
    },
    contractAddress: {
      type: String,
    },
    tokenId: {
      type: String,
    },
    tokenName: {
      type: String,
    },
    uri: {
      type: String,
    },
    mediaFile: {
      type: String,
    },
    coverImage: {
      type: String,
    },
    isPlace: {
      type: Boolean,
      default: false,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    itemType: {
      type: String,
      enum: ["PRIVATE", "PUBLIC"],
    },
    status: { type: String, default: status.ACTIVE },
  },
  options
);

schemaDefination.plugin(mongoosePaginate);
schemaDefination.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("nft1", schemaDefination);
