const purchasesModel = require("../../../models/purchases");
const mongoose = require("mongoose");

const purchasesServices = {
  createpurchases: async (insertObj) => {
    return await purchasesModel.create(insertObj);
  },

  findpurchases: async (query) => {
    return await purchasesModel.findOne(query);
  },

  findAllpurchasess: async (query) => {
    return await purchasesModel.find(query).select("nftId");
  },

  updatepurchases: async (query, updateObj) => {
    return await purchasesModel.findOneAndUpdate(query, updateObj, {
      new: true,
    });
  },

  purchasesList: async (query) => {
    return await purchasesModel.find(query).populate("nftId");
  },

  purchasesWithPaginate: async (validatedBody, userId) => {
    let query = { userId: userId, purchasesStatus: 'ACTIVE', status: "ACTIVE" }
    const {page, limit} = validatedBody;
    let options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
      populate: {path: 'nft1Id', populate: {path: 'userId'}}
    };
    return await purchasesModel.paginate(query, options);
  },

  purchasesWithPaginate1: async (validatedBody, userId) => {
    let query = { userId: userId, purchasesStatus: 'ACTIVE', status: "ACTIVE" }
    const {page, limit} = validatedBody;
    let options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
      populate: {path: 'nftId', populate: {path: 'userId'}}
    };
    return await purchasesModel.paginate(query, options);
  },

  purchasesListWithAggregate: async (userId) => {
    let query = { userId: mongoose.Types.ObjectId(userId) };
    return await purchasesModel.aggregate([
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

module.exports = { purchasesServices };
