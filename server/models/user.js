const bcrypt = require("bcryptjs");
const Mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const userType = require("../enums/userType");
const status = require("../enums/status");
const commonFunction = require("../../server/helper/util");

const options = {
  collection: "user",
  timestamps: true,
};

const { Schema } = Mongoose;
const userModel = new Schema(
  {
    walletAddress: { type: String, unique: true },
    ethAccount: {
      address: { type: String },
      privateKey: { type: String },
    },
    ip: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    name: { type: String },
    userName: { type: String, unique: true },
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    profilePic: { type: String, default: "" },
    coverPic: { type: String },
    masPageUrl: { type: String },
    speciality: { type: String, default: "" },
    bio: { type: String, default: "" },
    facebook: { type: String, default: "" },
    twitter: { type: String, default: "" },
    youtube: { type: String, default: "" },
    telegram: { type: String, default: "" },
    countryCode: { type: String },
    userType: { type: String, default: userType.USER },
    socialId: { type: String },
    socialType: { type: String },
    password: { type: String },
    planType: { type: String, default: "Basic" },
    base32: { type: String },
    deviceToken: { type: String },
    deviceType: { type: String },
    referralCode: { type: String },
    isReset: { type: Boolean },
    emailVerification: { type: Boolean, default: false },
    phoneVerification: { type: Boolean, default: false },
    blockStatus: { type: Boolean, default: false },
    isUpdated: { type: Boolean, default: false },
    isNewUser: { type: Boolean, default: true },
    masBalance: { type: Number, default: 0 },
    usdtBalance: { type: Number, default: 0 },
    bnbBalance: { type: Number, default: 0 },
    fdusdBalance: { type: Number, default: 0 },
    referralUserId: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    supporters: [
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
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    subscribeNft: [
      {
        type: Schema.Types.ObjectId,
        ref: "nft",
      },
    ],
    likesNft: [
      {
        type: Schema.Types.ObjectId,
        ref: "nft",
      },
    ],
    likesAuctionNft: [
      {
        type: Schema.Types.ObjectId,
        ref: "auctionNft",
      },
    ],
    likesFeed: [
      {
        type: Schema.Types.ObjectId,
        ref: "audience",
      },
    ],
    permissions: {
      dashboard: { type: Boolean, default: false },
      userManagement: { type: Boolean, default: false },
      subAdminManagement: { type: Boolean, default: false },
      settingsManagement: { type: Boolean, default: false },
      bannerManagement: { type: Boolean, default: false },
      bannerAppManagement: { type: Boolean, default: false },
      referralManagement: { type: Boolean, default: false },
      staticManagement: { type: Boolean, default: false },
    },
    status: { type: String, default: status.ACTIVE },
    bannerDuration: Number,
    bannerAppDuration: Number,
  },
  options
);
userModel.plugin(mongoosePaginate);
userModel.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("user", userModel);

Mongoose.model("user", userModel).find(
  { userType: userType.ADMIN },
  async (err, result) => {
    if (err) {
      console.log("Default admin creation error", err);
    } else if (result.length != 0) {
      console.log("Default admin already created.");
    } else {
      let userETHWallet = commonFunction.generateETHWallet();
      var obj = {
        name: "admin",
        userName: "admin",
        email: "masmarket2023@gmail.com",
        ethAccount: {
          address: userETHWallet.address.toLowerCase(),
          privateKey: userETHWallet.privateKey,
        },
        walletAddress: userETHWallet.address,
        password: bcrypt.hashSync("MasMarket2023"),
        referralCode: await commonFunction.getReferralCode(),
        userType: userType.ADMIN,
        status: status.ACTIVE,
        bannerDuration: 10,
        bannerAppDuration: 10,
        permissions: {
          dashboard: true,
          userManagement: true,
          subAdminManagement: true,
          settingsManagement: true,
          bannerManagement: true,
          bannerAppManagement: true,
          referralManagement: true,
          staticManagement: true,
        },
      };

      //
      Mongoose.model("user", userModel).create(obj, (err1, staticResult) => {
        if (err1) {
          console.log("Default admin error.", err1);
        } else {
          console.log("Default admin created.", staticResult);
        }
      });
    }
  }
);
