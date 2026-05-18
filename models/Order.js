const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(

  {

    name: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true
    },

    address: {
      type: String,
      required: true
    },

    cart: {
      type: Array,
      default: []
    },

    total: {
      type: Number,
      default: 0
    },

    slip: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      default: "pending"
    }

  },

  {
    timestamps: true
  }

);

module.exports =
  mongoose.model("Order", orderSchema);