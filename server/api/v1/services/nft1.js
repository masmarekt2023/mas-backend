const nft1Model = require("../../../models/nft1");
const userModel = require("../../../models/user");
const status = require("../../../enums/status");
const mongoose = require("mongoose");

const nft1Services = {
  createNFT1: async (insertObj) => {
    return await nft1Model.create(insertObj);
  },
  findNFT1: async (query) => {
    return await nft1Model
      .findOne(query)
      .populate("userId")
      .select(
        "-ethAccount.privateKey -password -referralCode -email -permissions"
      );
  },
  findNFT11: async (query) => {
    return await nft1Model.findOne(query);
  },

  findUserNFT1: async (query) => {
    return await nft1Model.find(query);
  },

  findNFT1WithPopulateDetails: async (id, userId) => {
    let query = {
      _id: mongoose.Types.ObjectId(id),
      status: { $ne: status.DELETE },
    };
    return await nft1Model.aggregate([
      { $match: query },
      {
        $addFields: {
          isLike: {
            $cond: {
              if: { $in: [mongoose.Types.ObjectId(userId), "$likesUsers"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $lookup: {
          from: "order",
          as: "orderDetails",
          let: {
            order_id: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$$order_id", "$NFT1Id"] },
              },
            },
            {
              $lookup: {
                from: "bid",
                localField: "_id",
                foreignField: "orderId",
                as: "bidDetails",
              },
            },
          ],
        },
      },
      {
        $project: {
          "userDetails.ethAccount.privateKey": 0,
          "userDetails.password": 0,
          "userDetails.email": 0,
          "userDetails.permissions": 0,
          "userDetails.referralCode": 0,
        },
      },
    ]);
  },

  updateNFT1: async (query, updateObj) => {
    return await nft1Model.findOneAndUpdate(query, updateObj, { new: true });
  },

  NFT1List: async (userId) => {
    // return await nft1Model.find(query).populate('userId orderId bidId');
    return await nft1Model.aggregate([
      { $match: { userId: userId, status: { $ne: status.DELETE } } },
      {
        $addFields: {
          isLike: {
            $cond: {
              if: { $in: [mongoose.Types.ObjectId(userId), "$likesUsers"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $lookup: {
          from: "order",
          localField: "orderId",
          foreignField: "_id",
          as: "orderDetails",
        },
      },
      {
        $lookup: {
          from: "bid",
          localField: "bidId",
          foreignField: "_id",
          as: "bidDetails",
        },
      },
      {
        $project: {
          "userDetails.ethAccount.privateKey": 0,
          "userDetails.password": 0,
          "userDetails.email": 0,
          "userDetails.permissions": 0,
          "userDetails.referralCode": 0,
        },
      },
    ]);
  },

  NFT1Subscriber: async (query) => {
    return await nft1Model.find(query).populate("userId");
  },

  NFT1SubscriberList: async (query) => {
    return await nft1Model.find(query).select("subscribers");
  },

  NFT1PaginateSearch: async (validatedBody) => {
    let query = { status: { $ne: status.DELETE } };
    const { search, page, limit } = validatedBody;
    if (search) {
      query.$or = [
        { bundleTitle : { $regex: search, $options: "i" } },
        { bundleName: { $regex: search, $options: "i" } },
        { tokenName: { $regex: search, $options: "i" } },
      ];
    }
    let options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
    };
    return await nft1Model.paginate(query, options);
  },

  myNFT1PaginateSearch: async (validatedBody, userId) => {
    let query = { userId: userId, status: { $ne: status.DELETE } };
    const { search, fromDate, toDate, page, limit } = validatedBody;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { symbol: { $regex: search, $options: "i" } },
        { categoryType: { $regex: search, $options: "i" } },
        { contractAddress: { $regex: search, $options: "i" } },
      ];
    }
    if (fromDate && !toDate) {
      query.createdAt = { $gte: fromDate };
    }
    if (!fromDate && toDate) {
      query.createdAt = { $lte: toDate };
    }
    if (fromDate && toDate) {
      query.$and = [
        { createdAt: { $gte: fromDate } },
        { createdAt: { $lte: toDate } },
      ];
    }
    let options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
      populate: {path: 'userId'}
    };
    return await nft1Model.paginate(query, options);
  },

  NFT1Count: async () => {
    return await nft1Model.countDocuments();
  },

  NFT1ListWithAggregate: async (validatedBody, userId, subscribeNFT1) => {
    let query = { status: { $ne: status.DELETE }, _id: { $nin: subscribeNFT1 } };
    const { search } = validatedBody;
    if (search) {
      query.$or = [
        { tokenId: { $regex: search, $options: "i" } },
        { bundleTitle: { $regex: search, $options: "i" } },
        { bundleName: { $regex: search, $options: "i" } },
        { contractAddress: { $regex: search, $options: "i" } },
        { tokenName: { $regex: search, $options: "i" } },
      ];
    }

    return await nft1Model.aggregate([
      { $match: query },
      {
        $addFields: {
          isLike: {
            $cond: {
              if: { $in: [mongoose.Types.ObjectId(userId), "$likesUsers"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          "userDetails.ethAccount.privateKey": 0,
          "userDetails.password": 0,
          "userDetails.email": 0,
          "userDetails.permissions": 0,
          "userDetails.referralCode": 0,
        },
      },
    ]);
  },

  listAllNFT1: async (validatedBody) => {
    let activeIds = await getActiveUser();
    let query = { status: { $ne: status.DELETE }, userId: { $in: activeIds } };
    const { search, page, limit } = validatedBody;
    if (search) {
      query.$or = [
        { tokenId: { $regex: search, $options: "i" } },
        { bundleTitle: { $regex: search, $options: "i" } },
        { bundleName: { $regex: search, $options: "i" } },
        { contractAddress: { $regex: search, $options: "i" } },
        { tokenName: { $regex: search, $options: "i" } },
      ];
    }
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sort: { createdAt: -1 },
      populate: { path: "userId", select: "-ethAccount.privateKey" }
    };
    return await nft1Model.paginate(query, options);
  },

  NFT1ListWithAggregatePipeline: async (validatedBody, userId) => {
    let query = {
      userId: mongoose.Types.ObjectId(userId),
      status: { $ne: status.DELETE },
    };
    const { search } = validatedBody;
    if (search) {
      query.$or = [
        { tokenId: { $regex: search, $options: "i" } },
        { bundleTitle: { $regex: search, $options: "i" } },
        { bundleName: { $regex: search, $options: "i" } },
        { contractAddress: { $regex: search, $options: "i" } },
        { tokenName: { $regex: search, $options: "i" } },
      ];
    }
    return await nft1Model.aggregate([
      { $match: query },
      {
        $addFields: {
          isLike: {
            $cond: {
              if: { $in: [mongoose.Types.ObjectId(userId), "$likesUsers"] },
              then: true,
              else: false,
            },
          },
        },
      },
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
        $lookup: {
          from: "order",
          as: "orderDetails",
          let: {
            order_id: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$$order_id", "$NFT1Id"] },
              },
            },
            {
              $lookup: {
                from: "bid",
                localField: "_id",
                foreignField: "orderId",
                as: "bidDetails",
              },
            },
          ],
        },
      },
      {
        $project: {
          "userId.ethAccount.privateKey": 0,
          "userId.password": 0,
          "userId.email": 0,
          "userId.permissions": 0,
          "userId.referralCode": 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
  },

  NFT1ListWithoutShared: async (validatedBody, userId) => {
    let query = {
      userId: mongoose.Types.ObjectId(userId),
      status: { $ne: status.DELETE },
    };
    // let query = { userId: mongoose.Types.ObjectId(userId), isShared: { $ne: true }, status: { $ne: status.DELETE } };
    const { search } = validatedBody;
    if (search) {
      query.$or = [
        { tokenId: { $regex: search, $options: "i" } },
        { bundleTitle: { $regex: search, $options: "i" } },
        { bundleName: { $regex: search, $options: "i" } },
        { contractAddress: { $regex: search, $options: "i" } },
        { tokenName: { $regex: search, $options: "i" } },
      ];
    }
    return await nft1Model.aggregate([
      { $match: query },
      {
        $addFields: {
          isLike: {
            $cond: {
              if: { $in: [mongoose.Types.ObjectId(userId), "$likesUsers"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $lookup: {
          from: "order",
          as: "orderDetails",
          let: {
            order_id: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$$order_id", "$NFT1Id"] },
              },
            },
            {
              $lookup: {
                from: "bid",
                localField: "_id",
                foreignField: "orderId",
                as: "bidDetails",
              },
            },
          ],
        },
      },
      {
        $project: {
          "userDetails.ethAccount.privateKey": 0,
          "userDetails.password": 0,
          "userDetails.email": 0,
          "userDetails.permissions": 0,
          "userDetails.referralCode": 0,
        },
      },
    ]);
  },

  NFT1ListWithAggregatePipelineForAll: async (validatedBody, userId) => {
    let activeIds = await getActiveUser();
    let query = {
      userId: { $in: activeIds },
      status: { $ne: status.DELETE },
    };
    const { search } = validatedBody;
    if (search) {
      query.$or = [
        { tokenId: { $regex: search, $options: "i" } },
        { bundleTitle: { $regex: search, $options: "i" } },
        { bundleName: { $regex: search, $options: "i" } },
        { contractAddress: { $regex: search, $options: "i" } },
        { tokenName: { $regex: search, $options: "i" } },
      ];
    }
    return await nft1Model.aggregate([
      { $match: query },
      {
        $addFields: {
          isLike: {
            $cond: {
              if: { $in: [mongoose.Types.ObjectId(userId), "$likesUsers"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $lookup: {
          from: "order",
          as: "orderDetails",
          let: {
            order_id: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$$order_id", "$NFT1Id"] },
              },
            },
            {
              $lookup: {
                from: "bid",
                localField: "_id",
                foreignField: "orderId",
                as: "bidDetails",
              },
            },
          ],
        },
      },
      {
        $project: {
          "userDetails.ethAccount.privateKey": 0,
          "userDetails.password": 0,
          "userDetails.email": 0,
          "userDetails.permissions": 0,
          "userDetails.referralCode": 0,
        },
      },
    ]);
  },

  multiUpdate: async (updateObj) => {
    return await nft1Model.updateMany({}, updateObj, { multi: true });
  },

  multiUpdateBundle: async (query, updateObj) => {
    return await nft1Model.updateMany(query, updateObj, { multi: true });
  },

  sharedBundleList: async (userId, bundleIds) => {
    return await nft1Model.aggregate([
      { $match: { _id: { $in: bundleIds }, status: { $ne: status.DELETE } } },
      {
        $addFields: {
          isSubscribe: {
            $cond: {
              if: { $in: [mongoose.Types.ObjectId(userId), "$subscribers"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $lookup: {
          from: "audience",
          localField: "_id",
          foreignField: "NFT1Id",
          as: "postList",
        },
      },
      {
        $project: {
          "userDetails.ethAccount.privateKey": 0,
          "userDetails.password": 0,
          "userDetails.email": 0,
          "userDetails.permissions": 0,
          "userDetails.referralCode": 0,
        },
      },
    ]);
  },

  sharedBundleListPerticular: async (userId, bundleIds) => {
    if (userId) {
      return await nft1Model.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(bundleIds),
            status: { $ne: status.DELETE },
          },
        },
        {
          $addFields: {
            isSubscribe: {
              $cond: {
                if: { $in: [mongoose.Types.ObjectId(userId), "$subscribers"] },
                then: true,
                else: false,
              },
            },
          },
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $lookup: {
            from: "audience",
            localField: "_id",
            foreignField: "NFT1Id",
            as: "postList",
          },
        },
        {
          $project: {
            "userDetails.ethAccount.privateKey": 0,
            "userDetails.password": 0,
            "userDetails.email": 0,
            "userDetails.permissions": 0,
            "userDetails.referralCode": 0,
          },
        },
      ]);
    } else {
      return await nft1Model.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(bundleIds),
            status: { $ne: status.DELETE },
          },
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $lookup: {
            from: "audience",
            localField: "_id",
            foreignField: "NFT1Id",
            as: "postList",
          },
        },
        {
          $project: {
            "userDetails.ethAccount.privateKey": 0,
            "userDetails.password": 0,
            "userDetails.email": 0,
            "userDetails.permissions": 0,
            "userDetails.referralCode": 0,
          },
        },
      ]);
    }
  },
};

module.exports = { nft1Services };

const getActiveUser = async () => {
  let userId = await userModel.find({ blockStatus: false }).select("_id");
  userId = userId.map((i) => i._id);
  return userId;
};
