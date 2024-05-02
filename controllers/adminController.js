const User = require("../Models/userSchema");
const bcrypt = require("bcryptjs");
const voucherCode=require('voucher-code-generator')
const Coupon=require("../Models/couponSchema")
const Product=require("../Models/productSchema")
const Category=require("../Models/categorySchema")
const Order=require("../Models/orderSchema")
const Offer=require("../Models/offerSchema")

const getLoginPage = async (req, res) => {
  try {

    res.render("admin/adminlogin");
  } catch (error) {
    console.log(error.message);
  }
};

const verifylogin = async (req, res) => {
  
  try {
    const { email, password } = req.body;
    const findAdmin = await User.findOne({
      email,
      isAdmin: "1",
    });

    if (findAdmin) {
      const passwordMatch = await bcrypt.compare( password, findAdmin.password );
      if (passwordMatch) {
        req.session.admin = true;
        res.redirect("/admin");
      } else {
        res.redirect("/admin/login", { message: "Invalid Password" });
      }
    } else {
      res.render("admin/login", { message: "Admin Not Found" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getDashboard = async (req, res) => {
  try {
    
    const totalProducts=await Product.countDocuments({})
    const totalCategories=await Category.countDocuments({})
    const totalOrders=await Order.countDocuments({orderStatus:"Delivered"})
    const products = await Product.find();
    const salesdetails=await Order.find()

    const topSellingProducts = await Order.aggregate([
            { $unwind: "$products" }, 
            {
              $group: {
                _id: "$products.product",
                totalQuantity: { $sum: "$products.quantity" },
              },
            }, 
            { $sort: { totalQuantity: -1 } }, 
            { $limit: 10 }, 
          ]);
      
          
          const productIds = topSellingProducts.map((product) => product._id);

          const productsData = await Product.find(
            { _id: { $in: productIds } },
            { productName: 1, image: 1 }
          );
            
    
    res.render("admin/dashboardindex",{totalProducts,totalCategories,totalOrders,productsData: productsData,topSellingProducts: topSellingProducts,salesdetails});
    
  } catch (error) {
    console.log(error.message);
  }
};


// chart

const showChart=async(req,res)=>{
  try {
    if(req.body.msg){
      const monthlySalesData=await Order.aggregate([
        {
          $match:{"orderStatus":"Delivered"},

        },
        {
          $group:{
            _id:{$month:"$createdAt"},
            totalAmount:{$sum:"$totalPrice"}
          }

        },
        {
          $sort: { _id: 1 }, 
        }
      ])
      

      const dailySalesData = await Order.aggregate([
        {
          $match: { "orderStatus": "Delivered" }, 
        },
        {
          $group: {
            _id: { $dayOfMonth: "$createdAt" }, 
            totalAmount: { $sum: "$totalPrice" },
          },
        },
        {
          $sort: { _id: 1 }, // Sort by day of month
        },
      ]);
        
      const orderStatuses = await Order.aggregate([
        {
          $unwind: "$products" 
        },
        {
          $group: {
            _id: "$orderStatus", 
            count: { $sum: 1 } 
          }
        }
      ]);
      
      const eachOrderStatusCount = {};
      orderStatuses.forEach((status) => {
        eachOrderStatusCount[status._id] = status.count;
      });
    
     
      res
        .status(200)
        .json({ monthlySalesData, dailySalesData, eachOrderStatusCount });
      
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
}








const getCouponPageAdmin=async(req,res)=>{
  try {
    const couponData=await Coupon.find({})
    
    res.render("admin/coupon",{couponData})
    
  } catch (error) {
    console.log(error.message)
    
  }
}
// coupon code(voucher code)




const createCoupon =async(req,res)=>{
  
  try {
    const coupondata={
     couponName: req.body.couponName,
     endDate:new Date(req.body.endDate + 'T00:00:00'),
     offerPrice:parseInt(req.body.offerPrice),
     minimumPrice:parseInt(req.body.minimumPrice)
    } 

    let couponCode=voucherCode.generate( {
      length:8,
      count:1,
      charset: voucherCode.charset("alphabetic")
    } )

    couponCode = couponCode[0];



    const newCoupon=new Coupon({
      name:coupondata.couponName,
      expireOn:coupondata.endDate,
      offerPrice:coupondata.offerPrice,
      minimumPrice:coupondata.minimumPrice,
      code:couponCode,
    })
    await newCoupon.save().then(val=>console.log(val))
    res.redirect("/admin/coupon")


  } catch (error) {
    console.log(error)
    
  }
}

// -------------------------delete coupon----------------------------------


const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.query.id;
    await Coupon.findOneAndDelete({_id: couponId});
    res.redirect("/admin/coupon");
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).send("Internal server error");
  }
};

// -----------listed coupon---------------------------------------------------------------------
const getListedCoupon=async(req,res)=>{
  try {
    let couponId=req.query.id
  const couponData=await Coupon.updateOne({_id:couponId},{$set:{isListed:false}})
  res.redirect("/admin/coupon")
  } catch (error) {
    console.log(error)
  }
  
}

// ..................................Unlisted----------------------------
const getUnlistedCoupon=async(req,res)=>{

  try {
    let couponId=req.query.id
    const couponData=await Coupon.updateOne({_id:couponId},{$set:{isListed:true}})
    res.redirect("/admin/coupon")
  } catch (error) {
    console.log(error)
  }
 
}

// ..............................................................

const geteditCoupon=async(req,res)=>{
  try {
    const id = req.query.id
    const coupon=await Coupon.findOne({_id:id})
    res.render("admin/couponEdit",{coupon})
    
  } catch (error) {
    console.log(error)
  }

}


// .....................................................................................

const editCoupon = async (req, res) => {
  

  try {
      const id = req.query.id
    
      const { couponName, offerPrice,expireOn,minimumPrice } = req.body
      
      const findCoupon = await Coupon.find({_id:id})
      const parts = expireOn.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

  
    const parsedExpireOn = new Date(year, month, day);

      
      if (findCoupon) {
    
        
          await Coupon.updateOne(
              { _id: id },
              {
                  name: couponName,                     
                  offerPrice:offerPrice,
                  minimumPrice:minimumPrice,
                  expireOn:parsedExpireOn

              })
          res.redirect("/admin/coupon")
      } else {
          console.log("Coupon not found");
      }

  } catch (error) {
      console.log(error.message);
  }
}
// .....................offer..management............................

// ....getoffer


const getOfferPageAdmin=async(req,res)=>{
  try {
     const offerData=await Offer.find({})
    const category = await Category.find({ isListed: true });
    const product=await Product.find({isBlocked:false})
    res.render("admin/offer",{catdata: category,prodata:product,offerData })
    
  } catch (error) {
    console.log(error.message)
    
  }
}

// ................................addoffer......................
const createOffer =async(req,res)=>{
  console.log(" entered")
  
  try {
    const { offerName, offerOn, product, category, endDate, offerPrice } = req.body;
  
     
    
    const newOffer = new Offer({
      name: offerName,
      discountOn: offerOn,
      DiscountValue: offerPrice,
      expireOn: endDate,
      
      discountedProduct: product,
      discountedCategory: category
  });
  const savedOffer = await newOffer.save();

  if (product && product !== '') {
    console.log("Product exists, updating sale price...");
    let productdata = await Product.findById(product);
    
    if (productdata) {
        let discountedProduct =productdata.salePrice- (productdata.salePrice * savedOffer.DiscountValue) / 100;
        productdata.salePrice = discountedProduct;
        await productdata.save();
        console.log("Sale price updated successfully.");
    } else {
        console.log("Product not found.");
    }
}

if(category && category!==''){
  let categorydata=await Product.find({"category.categoryId":{$in :category}})
  if (categorydata && categorydata.length > 0) {
    console.log("Categories found, updating sale prices...");
    
    for (let i = 0; i < categorydata.length; i++) {
        let discountedCategoryProduct = categorydata[i].salePrice-(categorydata[i].salePrice * savedOffer.DiscountValue) / 100;
        categorydata[i].salePrice = discountedCategoryProduct;
        await categorydata[i].save();
    
    }
    
} else {
    console.log("No products found in the specified categories.");
}

}

  
    res.redirect("/admin/offer")


  } catch (error) {
    console.log(error)
    
  }
}

// .....................delete offer............................
const deleteOffer = async (req, res) => {
  try {
    const offerId = req.query.id;
    await Offer.findOneAndDelete({_id: offerId});
    res.redirect("/admin/offer");
  } catch (error) {
    console.error("Error deleting offer:", error);
    res.status(500).send("Internal server error");
  }
};



// ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,

const getLogout = async (req, res) => {
  try {
    req.session.admin = null;
    res.redirect("/admin/login");
  } catch (error) {
    console.log(error.message);
  }
};

//---------------------------------------------------------------------------------------------------------------------------------




module.exports = {
  getLoginPage,
  verifylogin,
   getDashboard,
  getLogout,
  getCouponPageAdmin,
  createCoupon,
  deleteCoupon,
  getListedCoupon,
  getUnlistedCoupon,
  geteditCoupon,
  editCoupon,
  getOfferPageAdmin,
  createOffer,
  deleteOffer,
  showChart,
  // loadDashboard
  
  

};
