const bidModel = require("../../../models/bid");
const status = require("../../../enums/status");

const bidServices = {
  createBid: async (insertObj) => {
    return await bidModel.create(insertObj);
  },

  findBid: async (query) => {
    return await bidModel.findOne(query);
  },

  updateBid: async (query, updateObj) => {
    return await bidModel.findOneAndUpdate(query, updateObj, { new: true });
  },

  updateManyBid: async (orderId) => {
    return await bidModel.updateMany(
      { orderId: orderId },
      { bidStatus: "REJECTED" },
      { multi: true }
    );
  },

  bidList: async (query, validatedBody) => {
    const { page, limit } = validatedBody;
    const options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
      populate: {path: 'orderId'}
    };
    return await bidModel.paginate(query, options);

    // return await bidModel.find(query).populate([{ path: 'userId', select: '-ethAccount.privateKey' }, { path: 'orderId', populate: { path: "nftId" } }]).sort({ createdAt: -1 });
  },

  bidCount: async () => {
    return await bidModel.countDocuments();
  },
};

module.exports = { bidServices };
