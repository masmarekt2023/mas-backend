const salesModel = require("../../../models/sales");
const mongoose = require("mongoose");

const salesServices = {
  createsales: async (insertObj) => {
    return await salesModel.create(insertObj);
  },

  findsales: async (query) => {
    return await salesModel.findOne(query);
  },

  findAllsaless: async (query) => {
    return await salesModel.find(query).select("nftId");
  },

  updatesales: async (query, updateObj) => {
    return await salesModel.findOneAndUpdate(query, updateObj, {
      new: true,
    });
  },

  salesList: async (query) => {
    return await salesModel.find(query).populate("nftId");
  },

  salesWithPaginate: async (validatedBody, userId) => {
    let query = { userId: userId, salesStatus: 'ACTIVE', status: "ACTIVE" }
    const {page, limit} = validatedBody;
    let options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
      populate: {path: 'nft1Id', populate: {path: 'userId'}}
    };
    return await salesModel.paginate(query, options);
  },

  salesWithPaginate1: async (validatedBody, userId) => {
    let query = { userId: userId, salesStatus: 'ACTIVE', status: "ACTIVE" }
    const {page, limit} = validatedBody;
    let options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
      populate: {path: 'nftId', populate: {path: 'userId'}}
    };
    return await salesModel.paginate(query, options);
  },

  salesListWithAggregate: async (userId) => {
    let query = { userId: mongoose.Types.ObjectId(userId) };
    return await salesModel.aggregate([
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

module.exports = { salesServices };
