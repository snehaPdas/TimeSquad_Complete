
const express=require("express")



const userController=require("../controllers/usercontroller")
const cartController=require("../controllers/cartController")
const userprofileController=require("../controllers/userprofilecontroller")
const orderController=require("../controllers/orderController")
const wishListController=require("../controllers/wishListController")
const walletController=require("../controllers/walletController")


const {isLogged}=require("../Helpers/middleware")

const route=express.Router()

route.get("/",userController.GetHomepage)
route.get("/signup",userController.GetSignup)
route.post("/signup",userController.insertuser)
route.get("/verifyotp",userController.GetOtppage)
route.post("/verifyotp",userController.verifyOtp)
route.post("/resendOtp", userController.resendOtp)
route.get("/login",userController.GetLogin)
route.post("/login",userController.userLogin)
route.get("/logout",isLogged,userController.getLogoutUser)

//product routes
route.get("/shop",userController.getShopPage)
route.get("/search", userController.searchProducts)
route.get("/filterPrice", userController.filterByPrice)
route.get("/filterAlphabetical",userController.filterByAlphabet)
route.get("/filter", userController.filterProduct)
route.get("/productDetails", userController.getProductDetailsPage)
route.post("/sortProducts",userController.sortProduct)





//user profile
route.get("/profile",isLogged,userprofileController.getUserProfile)
route.get("/addAddress",isLogged,userprofileController.getAddressAddPage)
route.post("/addAddress",isLogged,userprofileController.postAddress)
route.get("/editAddress",isLogged,userprofileController.getAddressEdit)
route.post("/editAddress",isLogged,userprofileController.postEditAddress)
route.get("/deleteAddress", isLogged, userprofileController.getDeleteAddress)
route.post("/editUserDetails", isLogged, userprofileController.editUserDetails)




//cart
route.get("/cart",isLogged,cartController.getCartPage)
route.post("/addtocart",isLogged,cartController.addTocart)
route.post("/changeQuantity",isLogged,cartController.changeQuantity)
route.get("/deleteItem", isLogged, cartController.deleteProduct)





//order
route.get("/checkout",isLogged,orderController.getCheckout)
route.get("/checkouteditAddress",isLogged,orderController.getCheckoutAddressEdit)
route.post("/checkouteditAddress",isLogged,orderController.postCheckoutEditAddress)
route.get("/checkoutaddAddress",isLogged,orderController.CheckoutAddressAddPage)
route.post("/checkoutaddAddress",isLogged,orderController.postcheckoutAddress)
route.get("/checkoutdeleteAddress",isLogged,orderController.getCheckoutDeleteAddress)
route.post("/orderPlaced",isLogged,orderController.orderPlaced)
route.get("/orderDetails", isLogged, orderController.getOrderDetailsPage)
route.get("/cancelOrder",isLogged,orderController.cancelOrder)
route.post("/return", isLogged, orderController.returnOrder)
route.post("/verifyPayment", isLogged, orderController.verify)
route.get("/orderFailedPage",isLogged,orderController.getOrderfailed)


route.post("/orderFailure",isLogged,orderController.handleOrderFailure)
route.post("/retryPayment",isLogged,orderController.retryPayment)

// invoice
route.get("/invoice",isLogged,orderController.getinvoice)
route.get("/saveinvoice",orderController.invoicedownload)
// route.get("/saveinvoice",isLogged,orderController.generatePdf)

// coupon
route.post("/applyCoupon",isLogged,userController.applyCoupon)
route.delete("/deleteCoupon",isLogged,userController.removeCoupon)


//wishlist
route.get("/wishlist",isLogged,wishListController.getWishListPage)
route.post("/addToWishlist",isLogged,wishListController.addToWishList)
route.get("/deletewishlist",isLogged,wishListController.deleteWishList)

// wallet
route.post("/addMoney", isLogged, walletController.addMoneyToWallet)
route.post("/verify-payment", isLogged, walletController.verify_payment)



module.exports=route