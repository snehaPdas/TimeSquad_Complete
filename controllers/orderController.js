const mongoose = require("mongoose");

const User = require("../Models/userSchema");
const Cart = require("../Models/cartSchema");
const Product = require("../Models/productSchema");
const Order = require("../Models/orderSchema");
const Address = require("../Models/addressSchema");
const Coupon = require("../Models/couponSchema");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const easyinvoice = require("easyinvoice");
const fs = require("fs");
const { Readable } = require("stream");
const PDFDocument = require("pdfkit");

require("dotenv").config();

let instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getCheckout = async (req, res) => {
  try {
    const userId = req.session.user;
    const userCart = await Cart.findOne({ user: userId }).populate(
      "items.product"
    );
    const fixedCharges = 50;

    const UserId = req.query.userId;
    const findUser = await User.findOne({ user: userId });
    const addressData = await Address.findOne({ userId: userId });

    const toayDate = new Date().toISOString();
    const findCoupon = await Coupon.find({
      isListed: true,
      expireOn: { $gt: new Date(toayDate) },
      minimumPrice: { $lt: userCart.totalPrice },
    });

    if (userCart) {
      res.render("user/checkoutCart", {
        userCart,
        userAddress: addressData,
        userId: findUser,
        coupons: findCoupon,
        fixedCharges,
      });
    } else {
      res.render("user/checkoutCart", { userCart: null });
    }
  } catch (error) {
    console.log(error);
  }
};
const getCheckoutAddressEdit = async (req, res) => {
  try {
    const addressId = req.query.id;
    const user = req.session.user;
    const currentAddress = await Address.findOne({ "address._id": addressId });
    const addressData = currentAddress.address.find((item) => {
      return item._id.toString() === addressId.toString();
    });
    res.render("user/checkoutedit-address", {
      address: addressData,
      user: user,
    });
  } catch (error) {
    console.error(error);
  }
};

const postCheckoutEditAddress = async (req, res) => {
  try {
    const data = req.body;
    const addressId = req.query.id;
    const user = req.session.user;
    const findAddress = await Address.findOne({ "address._id": addressId });
    const matchedAddress = findAddress.address.find(
      (item) => item._id.toString() === addressId.toString()
    );
    await Address.updateOne(
      {
        "address._id": addressId,
        _id: findAddress._id,
      },
      {
        $set: {
          "address.$": {
            _id: addressId,
            addressType: data.addressType,
            name: data.name,
            city: data.city,
            landMark: data.landMark,
            state: data.state,
            pincode: data.pincode,
            phone: data.phone,
            altPhone: data.altPhone,
          },
        },
      }
    ).then((result) => {
      res.redirect("/checkout");
    });
  } catch (error) {
    console.log(error.message);
  }
};

const CheckoutAddressAddPage = async (req, res) => {
  try {
    const user = req.session.user;
    res.render("user/checkoutadd-address", { user: user });
  } catch (error) {
    console.log(error.message);
  }
};
const postcheckoutAddress = async (req, res) => {
  try {
    const user = req.session.user;

    const userData = await User.findOne({ _id: user });
    const {
      addressType,
      name,
      city,
      landMark,
      state,
      pincode,
      phone,
      altPhone,
    } = req.body;
    const userAddress = await Address.findOne({ userId: userData._id });

    if (!userAddress) {
      const newAddress = new Address({
        userId: userData._id,
        address: [
          {
            addressType,
            name,
            city,
            landMark,
            state,
            pincode,
            phone,
            altPhone,
          },
        ],
      });
      await newAddress.save();
    } else {
      userAddress.address.push({
        addressType,
        name,
        city,
        landMark,
        state,
        pincode,
        phone,
        altPhone,
      });
      await userAddress.save();
    }

    res.redirect("/checkout");
  } catch (error) {
    console.log(error.message);
  }
};
const getCheckoutDeleteAddress = async (req, res) => {
  try {
    const addressId = req.query.id;
    const findAddress = await Address.findOne({ "address._id": addressId });
    await Address.updateOne(
      { "address._id": addressId },
      {
        $pull: {
          address: {
            _id: addressId,
          },
        },
      }
    ).then((data) => res.redirect("/checkout"));
  } catch (error) {
    console.log(error.message);
  }
};

const orderPlaced = async (req, res) => {
  try {
    const { totalPrice, addressId, payment } = req.body;
    const parsedTotalPrice = parseFloat(totalPrice);
    const fixedCharges = 50;
    const totalPriceWithCharges = parsedTotalPrice + fixedCharges;
    console.log("fixed price", fixedCharges);
    console.log("fixed price", totalPrice);
    console.log("Total Price with Charges:", totalPriceWithCharges);

    const userId = req.session.user;
    const address = await Address.findOne({ userId: userId });
    const findUser = await User.findOne({ _id: userId });
    const findAddress = address.address.find(
      (item) => item._id.toString() === addressId
    );

    const userCart = await Cart.findOne({ user: userId }).populate(
      "items.product"
    );
    if (!userCart || userCart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    const products = userCart.items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
    }));
    for (const item of products) {
      // Update product quantity
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity },
      });
    }

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleString();

    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [], totalQuantity: 0, totalPrice: 0 } }
    );
    if (payment === "cod") {
      const newOrder = new Order({
        userId: userId,
        products: products,
        totalPrice: totalPriceWithCharges,
        address: addressId,
        address: findAddress,
        payment: payment,
        orderStatus: "pending",
        date: formattedDate,
      });
      const savedOrder = await newOrder.save();

      return res.status(200).json({
        success: true,
        order: savedOrder,
        method: "cod",
        orderId: userId,
        totalPrice: totalPriceWithCharges,
        fixedCharges,
      });
    } else if (payment === "online") {
      const razorOrder = new Order({
        userId: userId,
        products: products,
        totalPrice: totalPriceWithCharges,
        address: addressId,
        address: findAddress,
        payment: payment,
        orderStatus: "pending",
        date: formattedDate,
      });
      const razorsaveOrder = await razorOrder.save();

      const generateOrder = await generateOrderRazorpay(
        razorsaveOrder._id,
        totalPrice
      );

      return res.status(200).json({
        success: true,
        order: razorsaveOrder,
        method: "online",
        razorpayOrder: generateOrder,
        ordrId: razorsaveOrder._id,
        totalPrice: totalPriceWithCharges,
        fixedCharges,
      });
    } else if (payment === "wallet") {
      if (totalPrice <= findUser.wallet) {
        const data = (findUser.wallet -= totalPrice);
        const newHistory = {
          amount: data,
          status: "debit",
          date: Date.now(),
        };
        const walletOrder = new Order({
          userId: userId,
          products: products,
          totalPrice: totalPriceWithCharges,
          address: addressId,
          address: findAddress,
          payment: payment,
          orderStatus: "pending",
          date: formattedDate,
        });
        const walletsaveOrder = await walletOrder.save();

        findUser.history.push(newHistory);
        await findUser.save();
        return res.status(200).json({
          success: true,
          method: "wallet",
          order: walletsaveOrder,
          orderId: walletOrder,
          totalPrice: totalPriceWithCharges,
          fixedCharges,
        });
      } else {
        res.json({ payment: false, method: "wallet", success: false });
        return;
      }
    } else {
      return res.status(200).json({
        success: true,
        paymentData: {
          /* include payment data here */
        },
      });
    }
  } catch (error) {
    console.error("Error placing order:", error);

    res.status(500).json({ success: false, error: error.message });
  }
};

const generateOrderRazorpay = (orderId, total) => {
  return new Promise((resolve, reject) => {
    const options = {
      amount: total * 100,
      currency: "INR",
      receipt: String(orderId),
    };
    instance.orders.create(options, function (err, order) {
      if (err) {
        reject(err);
      } else {
        console.log("Order Generated RazorPAY: " + JSON.stringify(order));
        resolve(order);
      }
    });
  });
};

const verify = (req, res) => {
  

  let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(
    `${req.body.payment.razorpay_order_id}|${req.body.payment.razorpay_payment_id}`
  );
  hmac = hmac.digest("hex");
  if (hmac === req.body.payment.razorpay_signature) {
    res.json({ status: true });
  } else {
    res.json({ status: false });
  }
};

const handleOrderFailure = async (req, res) => {
  try {
    console.log("checkinggg", req.body);
    const orderId = req.body.orderId;
    console.log("order-------------------", orderId);
    const order = await Order.findByIdAndUpdate(orderId, {
      orderStatus: "failed",
    });
    console.log("ur order is.........................", order);
    res.status(200).json({ status: true, message: "deleted successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

const getOrderDetailsPage = async (req, res) => {
  try {
    const userId = req.session.user;
    const orderId = req.query.id;
    const findOrder = await Order.findOne({ _id: orderId }).populate({
      path: "products.product",
      select: "productName salePrice productImage",
    });
    const findUser = await User.findOne({ _id: userId });
    res.render("User/orderDetails", {
      orders: findOrder,
      user: findUser,
      orderId,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const findUser = await User.findOne({ _id: userId });
    if (!findUser) {
      return res.status(404).json({ message: "user not found" });
    }
    const orderId = req.query.orderId;
    const selectedValue = req.query.selectedValue;

    await Order.updateOne(
      { _id: orderId },
      { $set: { orderStatus: selectedValue } }
    ).then((data) => console.log("userchangeoption:", data));

    const findOrder = await Order.findOne({ _id: orderId }).populate(
      "products.product"
    );

    if (findOrder.payment === "wallet" || findOrder.payment === "online") {
      findUser.wallet += findOrder.totalPrice;
      const newHistory = {
        amount: findOrder.totalPages,
        status: "credit",
        date: Date.now(),
      };
      findUser.history.push(newHistory);
      await findUser.save();
    }

    const pro = findOrder.products;
    for (const productData of findOrder.products) {
      const productId = productData.product;
      const quantity = productData.quantity;

      const product = await Product.findById(productId);

      if (product) {
        product.quantity += quantity;
        console.log(
          "Updated quantity.............................:",
          product.quantity
        );

        await product.save();
      }
    }

    res.redirect("/profile");
  } catch (error) {
    console.log(error);
  }
};

const cancelOrderAdmin = async (req, res) => {
  try {
    const finUser = await User.findOne({
      isAdmin: 1,
    });
    const userId = req.session.user;
    const findCustomer = await User.findOne({ _id: userId });
    console.log("customer is here==========", findCustomer);
    if (!finUser) {
      return res.status(404).json({ message: "user not found" });
    }
    const orderId = req.query.orderId;
    const selectedValue = req.query.status;
    await Order.updateOne(
      { _id: orderId },
      { $set: { orderStatus: selectedValue } }
    ).then((data) => console.log("userchangeoption:", data));
    const findOrder = await Order.findOne({ _id: orderId }).populate(
      "products.product"
    );

    if (findOrder.payment === "wallet" || findOrder.payment === "online") {
      findCustomer.wallet += findOrder.totalPrice;
      const newHistory = {
        amount: findOrder.totalPages,
        status: "credit",
        date: Date.now(),
      };
      findCustomer.history.push(newHistory);
      await findCustomer.save();
    }

    const pro = findOrder.products;

    for (const productData of findOrder.products) {
      const productId = productData.product;
      const quantity = productData.quantity;

      const product = await Product.findById(productId);

      if (product) {
        product.quantity += quantity;

        await product.save();
      }
    }
    res.redirect("/admin/orderList");
  } catch (error) {
    console.log(error);
  }
};

const returnOrder = async (req, res) => {
  console.log("came to server side for returning");

  try {
    const userId = req.session.user;
    const orderId = req.query.id;
    const selectedValue = req.query.status;
    const returnReason = req.body.reason;
    const findUser = await User.findOne({ _id: userId });
    const findOrders = await Order.findOne({ _id: orderId });
    if (!findUser) {
      return res.status(404).json({ message: "user not found" });
    }

    const fourteenDaysFromNow = new Date();

    let spldate = fourteenDaysFromNow.setDate(
      fourteenDaysFromNow.getDate() + 14
    );
    spldate = new Date().toISOString();

    // if (findOrder.deliveryDate <= spldate) {

    await Order.updateOne(
      { _id: orderId },
      { $set: { orderStatus: "Returned", cancellationReason: returnReason } }
    ).then((data) => console.log("userchangeoption:", data));

    const findOrder = await Order.findOne({ _id: orderId }).populate(
      "products.product"
    );

    if (
      findOrder.payment === "wallet" ||
      findOrder.payment === "online" ||
      findOrder.payment === "cod"
    ) {
      findUser.wallet += findOrder.totalPrice;
      const newHistory = {
        amount: findOrder.totalPrice,
        status: "credit",
        date: Date.now(),
      };
      findUser.history.push(newHistory);
      await findUser.save();
    }
    res.redirect("/profile");
  } catch (error) {
    console.log(error);
  }
};

const getOrderListPageAdmin = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).populate({
      path: "products.product",
      select: "salePrice",
    });
    orders.forEach((order) => {
      order.createdOn = order.createdAt.toLocaleString();
    });
    let itemsPerPage = 5;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(orders.length / 3);
    const currentOrder = orders.slice(startIndex, endIndex);

    res.render("Admin/orderlist", {
      orders: currentOrder,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getOrderDetailsPageAdmin = async (req, res) => {
  try {
    const orderId = req.query.id;
    findOrder = await Order.findOne({ _id: orderId }).populate({
      path: "products.product",
      select: "productName salePrice productImage",
    });
    const timestamp = parseInt(findOrder.date);
    if (!isNaN(timestamp)) {
      findOrder.createdOn = new Date(timestamp);
    } else {
      findOrder.createdOn = null;
    }
    res.render("Admin/orderDetails", { orders: findOrder, orderId });
  } catch (error) {
    console.log(error);
  }
};

const changeOrderStatus = async (req, res) => {
  try {
    const currentDate = new Date();
    // const formattedDate = currentDate.toISOString();

    const orderId = req.query.orderId;
    await Order.updateOne(
      { _id: orderId },
      { $set: { orderStatus: req.query.status } }
    ).then((data) => console.log(data));

    if (req.query.status === "Delivered") {
      const deliveredDate = currentDate;

      await Order.updateOne(
        { _id: orderId },
        { $set: { deliveryDate: deliveredDate } }
      );
    }
    res.redirect("/Admin/orderList");
  } catch (error) {
    console.log(error.message);
  }
};

const getOrderfailed = async (req, res) => {
  try {
    res.render("user/orderFailed");
  } catch (error) {
    console.log(error);
  }
};

const retryPayment = async (req, res) => {
  try {
    console.log("yes");
    const orderId = req.body.orderid;
    const order = await Order.findById(orderId);
    console.log("id==========>", orderId);
    await Order.updateOne(
      { _id: orderId },
      { $set: { orderStatus: "pending" } }
    ).then((data) => console.log(data));
    const totalAmount = order.totalPrice;

    res.json({ order: orderId, totalAmount: totalAmount, razorpay: true });
  } catch (error) {
    console.log(error);
  }
};

const getinvoice = async (req, res) => {
  try {
    const orderid = req.query.id;
    const orderDetails = await Order.find({ _id: orderid }).populate(
      "products.product"
    );
    res.render("user/invoice", { order: orderDetails });
  } catch (error) {
    console.log(error);
  }
};

const invoicedownload = async (req, res) => {
  try {
    const orderId = req.query.id;

    const orderData = await Order.findOne({ _id: orderId }).populate("products.product"); 
    const address = orderData.address; 
    const order = {
      // orderId: id,
      total: orderData.totalPrice,
      // discount: total1 - orderData.totalPrice,
      date: orderData.createdOn,
      paymentMethod: orderData.payment,
      orderStatus: orderData.status,
      name: address[0].name,
      number: address[0].phone,
      pincode: address[0].pincode,
      town: address[0].landMark,
      state: address[0].state,
      items: orderData.products,
    };

    const products = order.items.map((product) => ({
      description: product.product?.productName || "dummy name",
      quantity: parseInt(product?.quantity),
      price: product.product.salePrice || 0,
      taxRate: 6,
    }));
 
    
    var data = {
      apiKey: "free",
      mode: "development",
      sender: {
        company: "Timesquad eCommerce",
        address: "Maradu PO,Ernakulam",
        city: "Kochi",
        country: "India",
      },
      client: {
        company: order.name,
        address: order.state,
        city: order.city || "palakkad",
        zip: order.pincode,
      },
      products:products
    };

    console.log(data);
    const pdfdata = await easyinvoice.createInvoice(data);
    const pdfBuffer = Buffer.from(pdfdata.pdf, "base64");
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



module.exports = {
  getCheckout,
  getCheckoutAddressEdit,
  postCheckoutEditAddress,
  CheckoutAddressAddPage,
  postcheckoutAddress,
  getCheckoutDeleteAddress,
  orderPlaced,
  getOrderListPageAdmin,
  getOrderDetailsPageAdmin,
  changeOrderStatus,
  getOrderDetailsPage,
  cancelOrder,
  cancelOrderAdmin,
  verify,
  returnOrder,
  getOrderfailed,
  handleOrderFailure,
  retryPayment,
  getinvoice,
  invoicedownload,
  
};
