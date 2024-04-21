const bcrypt = require("bcryptjs");
const Mongoose = require("mongoose");


const options = {
  collection: "bill",
  timestamps: true,
};

const { Schema } = Mongoose;
const billModel = new Schema(
  {
    
    billId: {
      type: Schema.Types.ObjectId,
      ref: "bill",
    },
    name: { type: String },
    surname: { type: String },
    email: { type: String  },
    phoneNumber: { type: String },
    postcode: { type: String },
    address1: { type: String },
    address2: { type: String },
    serialNumber: { type: String }
    
  },options);

  module.exports = Mongoose.model("bill", billModel);
