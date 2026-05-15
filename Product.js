const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    name_en: { type: String, default: "" },
    name_kh: { type: String, default: "" },
    code: { type: String, default: "" },

    price: { type: Number, required: true },
    oldPrice: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },

    stock: { type: Number, default: 0 },
    category: { type: String, default: "" },
    status: { type: String, default: "active" },
    deliveryFee: { type: Number, default: 0 },
    deliveryType: { type: String, default: "paid" },

    colors: { type: [String], default: [] },
    options: { type: [String], default: [] },
    description: { type: String, default: "" },
    isPreOrder: { type: Boolean, default: true },

    images: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
