const subscriptionModel = require("../../../models/subscription");
const mongoose = require("mongoose");

const subscriptionServices = {
  createSubscription: async (insertObj) => {
    return await subscriptionModel.create(insertObj);
  },

  findSubscription: async (query) => {
    return await subscriptionModel.findOne(query);
  },

  findAllSubscriptions: async (query) => {
    return await subscriptionModel.find(query).select("nftId");
  },

  updateSubscription: async (query, updateObj) => {
    return await subscriptionModel.findOneAndUpdate(query, updateObj, {
      new: true,
    });
  },

  subscriptionList: async (query) => {
    return await subscriptionModel.find(query).populate("nftId");
  },

  subscriptionWithPaginate: async (validatedBody, userId) => {
    let query = { userId: userId, subscriptionStatus: 'ACTIVE', status: "ACTIVE" }
    const {page, limit} = validatedBody;
    let options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
      populate: {path: 'nftId', populate: {path: 'userId'}}
    };
    return await subscriptionModel.paginate(query, options);
  },

  subscriptionWithPaginate1: async (validatedBody, userId) => {
    let query = { userId: userId, subscriptionStatus: 'ACTIVE', status: "ACTIVE" }
    const {page, limit} = validatedBody;
    let options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
      populate: {path: 'nftId', populate: {path: 'userId'}}
    };
    return await subscriptionModel.paginate(query, options);
  },

  subscriptionListWithAggregate: async (userId) => {
    let query = { userId: mongoose.Types.ObjectId(userId) };
    return await subscriptionModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "nft",
          as: "bundleDetails",
          localField: "nftId",
          foreignField: "_id",
          pipeline: [

            {
              $lookup: {
                from: "user",
                localField: "userId",
                foreignField: "_id",
                as: "userId",
              },
            },
            {
              $unwind: "$userId",
            },
            {
              $project: {
                "userId.ethAccount.privateKey": 0,
                "userId.password": 0,
              },
            },
          ],
        }

      },
      {
        $unwind: "$bundleDetails",
      },
      { $sort: { createdAt: -1 } },
    ]);
  },
};

module.exports = { subscriptionServices };
