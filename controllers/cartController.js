const mongoose = require("mongoose");

const Cart = require("../Models/cartSchema");
const Product = require("../Models/productSchema");
const User = require("../Models/userSchema");

const getCartPage = async (req, res) => {
  try {
    const userId = req.session.user;
    const userCart = await Cart.findOne({ user: userId }).populate( "items.product")
      

    if (userCart) {
      res.render("user/cart", { userCart });
    } else {
      res.render("user/cart", { userCart : '' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const   addTocart = async (req, res) => {
  try {
    
    const productid = req.body.id;
    
   //const qty=req.body.quantity
  
    const userId = req.session.user;
    const findUser = await User.findOne({ _id: userId });
    if (!findUser) {
      return res.status(404).json({ message: "user not found" });
    }
    const findproduct = await Product.findById(productid);
    if (!findproduct) {
      return res.status(404).json({ message: "product not found" });
    }
    let userCart = await Cart.findOne({ user: userId });
    
    if (!userCart) {
      userCart = new Cart({ user: userId, items: [], price: 0 });
    }
    //check whether the product is already exist in the cart
    const existingItemIndex = userCart.items.findIndex(
      (item) => item.product.toString() === productid
    );
  
    let incomingQuantity = 1;
    
    let totalQuantityInCart;

    if (existingItemIndex >= 0) {
      
       totalQuantityInCart =
        userCart.items[existingItemIndex].quantity + incomingQuantity;
      if (totalQuantityInCart <= findproduct.quantity) {
      
        //update the quantity
        userCart.items[existingItemIndex].quantity += incomingQuantity;
        userCart.items[existingItemIndex].price =
          findproduct.salePrice * userCart.items[existingItemIndex].quantity;
        //push the item into the cart
      }  else {
        // Product is out of stock
        return res.status(200).json({
          status: "out of stock",
          message: "Product is out of stock.",
        });
      }
    }   else {
      if (findproduct.quantity > 0) {
        userCart.items.push({
          product: productid,
          quantity: incomingQuantity,
          price: findproduct.salePrice * incomingQuantity,

        
        });

       } else {
        return res.status(200).json({
          status: "out of stock",
          message: "Product is out of stock.",
        });
      }
    }
    userCart.totalQuantity = userCart.items.reduce(
      (total, item) => total + item.quantity,0);
    userCart.totalPrice = userCart.items.reduce((total, item) => total + item.price,0);
  

    await userCart.save();
    return res.status(200).json({
      status: true,
      message: "Product added to the cart successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};



const changeQuantity = async (req, res) => {
  try {
    const productId = req.body.id;
    const action = req.body.action;
    const userId = req.session.user;

    

    const userCart = await Cart.findOne({ user: userId }).populate("items.product");
    const cartItem = userCart.items.find((item) => item.product._id.toString() === productId);

    console.log("the usercartitem:", cartItem);

    if (!cartItem) {
      return res.status(404).json({ message: "Product not found in the cart" });
    }

    const actionValue = parseInt(action);

    if (actionValue === 1) {
      if (cartItem.quantity < cartItem.product.quantity) {

        cartItem.quantity += 1;
        cartItem.price =cartItem.quantity * cartItem.product.salePrice ;
        // return res.status(200).json({status:true, message: 'Quantity Updated' });
      } else {

        return res
          .status(400)
          .json({ status: false, message: "Quantity limit reached" });
      }
    } else if (actionValue === -1) {
       if (cartItem.quantity > 1) {
        cartItem.quantity -= 1;
        cartItem.price =cartItem.quantity * cartItem.product.salePrice ;
      } else {
        return res
          .status(400)
          .json({ status: false, message: "Quantity cannot be less than 1" });
      }
    }

    userCart.totalQuantity = calculateTotalQuantity(userCart.items);
    userCart.totalPrice = calculateTotalPrice(userCart.items);

    await userCart.save();

    res.status(200).json({
      status: true,
      message: "Quantity updated successfully",
      updatedCart: userCart,
    });
  } catch (error) {
    console.error("Internal server error : ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const calculateTotalQuantity = (cartItems) => {
  return cartItems.reduce((total, item) => total + item.quantity, 0);
};
const calculateTotalPrice = (cartItems) => {
  return cartItems.reduce(
    (total, item) => total + item.product.salePrice * item.quantity,0);
};




const deleteProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const userId = req.session.user;
    const userCar = await Cart.findOne({ user: userId }).populate(
      "items.product"
    );
    if (!userCar) {
      return res.status(404).json({ message: "User's cart not found" });
    }
    

    const cartItemIndex = userCar.items.findIndex((item) => {
      console.log("Item ID:", item.product._id.toString());
      console.log("Provided ID:", productId);
      return item.product._id.toString() === productId;
    });

    const removedItem = userCar.items.splice(cartItemIndex, 1)[0];

    userCar.totalQuantity -= removedItem.quantity;
    userCar.totalPrice -= removedItem.price 
     //removedItem.quantity;
    await userCar.save();

    res.redirect("/cart");
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { addTocart, getCartPage, deleteProduct, changeQuantity };
