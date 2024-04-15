const buyingModel = require("../../../models/buying");
const mongoose = require("mongoose");

const buyingServices = {
  createbuying: async (insertObj) => {
    return await buyingModel.create(insertObj);
  },

  findbuying: async (query) => {
    return await buyingModel.findOne(query);
  },

  findAllbuyings: async (query) => {
    return await buyingModel.find(query).select("nftId");
  },

  updatebuying: async (query, updateObj) => {
    return await buyingModel.findOneAndUpdate(query, updateObj, {
      new: true,
    });
  },

  buyingList: async (query) => {
    return await buyingModel.find(query).populate("nftId");
  },

  buyingWithPaginate: async (validatedBody, userId) => {
    let query = { userId: userId, buyingStatus: 'ACTIVE', status: "ACTIVE" }
    const {page, limit} = validatedBody;
    let options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
      populate: {path: 'nftId', populate: {path: 'userId'}}
    };
    return await buyingModel.paginate(query, options);
  },

  buyingWithPaginate1: async (validatedBody, userId) => {
    let query = { userId: userId, buyingStatus: 'ACTIVE', status: "ACTIVE" }
    const {page, limit} = validatedBody;
    let options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
      populate: {path: 'nftId', populate: {path: 'userId'}}
    };
    return await buyingModel.paginate(query, options);
  },

  buyingListWithAggregate: async (userId) => {
    let query = { userId: mongoose.Types.ObjectId(userId) };
    return await buyingModel.aggregate([
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

module.exports = { buyingServices };
