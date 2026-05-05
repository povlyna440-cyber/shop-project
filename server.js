require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const Product = require("./models/Product");
const Order = require("./models/Order");

const app = express();

// ===== CREATE FOLDERS =====
["uploads", "public", "admin"].forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
});

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// ===== MONGODB =====
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

// ===== MULTER =====
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, Date.now() + "-" + safeName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "image/gif"
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed: JPG, PNG, WEBP, GIF"), false);
    }
  }
});
// ===== HELPERS =====
function parseList(value) {
  if (Array.isArray(value)) return value;

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toBool(value) {
  return value === true || value === "true" || value === "on" || value === "1";
}

function productPayload(body, images) {
  const data = {
    name: body.name || "",
    name_en: body.name_en || "",
    name_kh: body.name_kh || "",
    code: body.code || "",

    price: Number(body.price || 0),
    oldPrice: Number(body.oldPrice || 0),
    discountPercent: Number(body.discountPercent || 0),

    stock: Number(body.stock || 0),
    category: body.category || "",
    status: body.status || "active",
    deliveryFee: Number(body.deliveryFee || 0),
    deliveryType: body.deliveryType || "paid",

    colors: parseList(body.colors),
    options: parseList(body.options),
    description: body.description || "",
    isPreOrder: toBool(body.isPreOrder)
  };

  if (images) {
    data.images = images;
  }

  return data;
}

// ===== CREATE PRODUCT =====
app.post("/api/products", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ error: "Product name is required" });
    }

    if (!req.body.price) {
      return res.status(400).json({ error: "Product price is required" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const images = req.files.map((file) => "/uploads/" + file.filename);
    const product = await Product.create(productPayload(req.body, images));

    res.json(product);
  } catch (err) {
    console.log("Create Product Error:", err);
    res.status(500).json({ error: "Create product failed" });
  }
});

// ===== UPDATE PRODUCT =====
app.put("/api/products/:id", upload.array("images", 5), async (req, res) => {
  try {
    const oldProduct = await Product.findById(req.params.id);

    if (!oldProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    const images =
      req.files && req.files.length > 0
        ? req.files.map((file) => "/uploads/" + file.filename)
        : oldProduct.images;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      productPayload(req.body, images),
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.log("Update Product Error:", err);
    res.status(500).json({ error: "Update product failed" });
  }
});

// ===== GET PRODUCTS =====
app.get("/api/products", async (req, res) => {
  try {
    const data = await Product.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.log("Get Products Error:", err);
    res.status(500).json({ error: "Get products failed" });
  }
});

// ===== DELETE PRODUCT =====
app.delete("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.log("Delete Product Error:", err);
    res.status(500).json({ error: "Delete product failed" });
  }
});

// ===== CREATE ORDER + TELEGRAM =====
app.post("/api/order", upload.single("slip"), async (req, res) => {
  try {
    const cart = JSON.parse(req.body.cart || "[]");

   if (!req.body.name || !req.body.phone || (!req.body.address && !req.body.location)) {
  return res.status(400).json({ error: "Name, phone and address or location are required" });
}

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // បូក qty តាម product id ដើម្បីកុំឱ្យ product ដូចគ្នា check stock ខុស
    const qtyByProduct = {};

    cart.forEach((item) => {
      const id = item._id;
      const qty = Number(item.qty || item.quantity || 1);

      if (!id) return;
      qtyByProduct[id] = (qtyByProduct[id] || 0) + qty;
    });

    // Check stock មុន create order / មុនកាត់ stock
    for (const productId of Object.keys(qtyByProduct)) {
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(400).json({ error: "Product not found" });
      }

      if (Number(product.stock || 0) < qtyByProduct[productId]) {
        return res.status(400).json({
          error: `${product.name} is out of stock`
        });
      }
    }

    const order = await Order.create({
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address,
      cart,
      slip: req.file ? "/uploads/" + req.file.filename : ""
    });

    const TOKEN = process.env.TG_TOKEN;
    const CHAT_ID = process.env.TG_CHAT_ID;

if (TOKEN && CHAT_ID) {
  let text = "🛒 NEW ORDER\n\n";
  let total = 0;

  cart.forEach((p, i) => {
    const qty = Number(p.qty || p.quantity || 1);
    const price = Number(p.price || 0);
    const deliveryFee =
      p.deliveryType === "free"
        ? 0
        : Number(p.deliveryFee || p.delivery || p.shippingFee || 0);

    const itemTotal = Number(p.itemTotal || ((price * qty) + deliveryFee));
    const option = p.selectedOption || p.option || p.color || "";
    const note = p.note || "";
    const name = p.name_en || p.name || p.name_kh || "Product";

    text += `${i + 1}. ${name} x ${qty} - $${(price * qty).toFixed(2)}\n`;

    if (option) {
      text += `Color/Option: ${option}\n`;
    }

    if (note) {
      text += `Note: ${note}\n`;
    }

    if (deliveryFee > 0) {
      text += `Delivery: $${deliveryFee.toFixed(2)}\n`;
    }

    text += `Item Total: $${itemTotal.toFixed(2)}\n\n`;

    total += itemTotal;
  });

  text += "━━━━━━━━━━━━━━";
  text += `\n💰 Total: $${total.toFixed(2)}`;
  text += `\n👤 Name: ${req.body.name}`;
  text += `\n📞 Phone: ${req.body.phone}`;
const address = req.body.address || "";
const location = req.body.location || "";

if (address && address !== location) {
  text += `\n📍 Address: ${address}`;
}

if (location) {
  text += `\n🗺 Location: ${location}`;
}

  text += `\n🧾 Order ID: ${order._id}`;

  await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text
  });

  if (req.file) {
    const slipForm = new FormData();

    slipForm.append("chat_id", CHAT_ID);
    slipForm.append(
      "photo",
      fs.createReadStream(path.join(__dirname, "uploads", req.file.filename))
    );
    slipForm.append("caption", "📸 Payment Slip");

    await axios.post(
      `https://api.telegram.org/bot${TOKEN}/sendPhoto`,
      slipForm,
      { headers: slipForm.getHeaders() }
    );
  }
}

    // កាត់ stock តែបន្ទាប់ពី order + telegram ជោគជ័យ
    for (const productId of Object.keys(qtyByProduct)) {
      await Product.findByIdAndUpdate(productId, {
        $inc: { stock: -qtyByProduct[productId] }
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (err) {
    console.log("Order Error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.description || err.message || "Order failed" });
  }
});


// ===== ADMIN STATIC =====
app.use("/admin", express.static(path.join(__dirname, "admin")));

// ===== START =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running: http://localhost:" + PORT);
});
