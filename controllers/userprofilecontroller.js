const User = require("../Models/userSchema");
const Product = require("../Models/productSchema");
const Address = require("../Models/addressSchema");
const Order = require("../Models/orderSchema");
const bcrypt = require("bcryptjs");

const passwordsecure = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};


const getUserProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findById({ _id: userId });
    const orderData = await Order.find({ userId: userId }).sort({
      createdOn: -1,
    });
    const addressData = await Address.findOne({ userId: userId });
    res.render("user/profile", {
      user: userData,
      userAddress: addressData,
      order: orderData,
    });
  } catch (error) {
    console.error(error);
  }
};
const getAddressAddPage = async (req, res) => {
  try {
    const user = req.session.user;
    res.render("user/add-address", { user: user });
  } catch (error) {
    console.log(error.message);
  }
};

const postAddress = async (req, res) => {
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

    res.redirect("/profile");
  } catch (error) {
    console.log(error.message);
  }
};

const getAddressEdit = async (req, res) => {
  try {
    const addressId = req.query.id;
    const user = req.session.user;
    const currentAddress = await Address.findOne({ "address._id": addressId });
    const addressData = currentAddress.address.find((item) => {
      return item._id.toString() === addressId.toString();
    });
    res.render("user/edit-address", { address: addressData, user: user });
  } catch (error) {
    console.error(error);
  }
};

const postEditAddress = async (req, res) => {
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
      res.redirect("/profile");
    });
  } catch (error) {
    console.log(error.message);
  }
};
const getDeleteAddress = async (req, res) => {
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
    ).then((data) => res.redirect("/profile"));
  } catch (error) {
    console.log(error.message);
  }
};

const editUserDetails = async (req, res) => {
  try {
    const userId = req.query.id;
    const data = req.body;
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          name: data.name,
          phone: data.phone,
          password:await passwordsecure(data.password)
        },
      }
    ).then((data) => console.log(data));
    res.redirect("/profile");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  getUserProfile,
  getAddressAddPage,
  postAddress,
  getAddressEdit,
  postEditAddress,
  getDeleteAddress,
  editUserDetails,
};
