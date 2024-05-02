const User=require("../Models/userSchema")
const Product=require("../Models/productSchema")
const WishList=require("../Models/wishListSchema")

const getWishListPage=async (req,res)=>{
    try {
        const UserId=req.session.user
        const wishlist=await WishList.findOne({user:UserId}).populate("products.itemId")
        if(wishlist){
        res.render("user/wishlist",{wishlist})
        }else{
            res.render("user/wishlist",{wishlist:""})
        }
        
    } catch (error) {
        console.log(error)
        
    }
}


const addToWishList = async(req,res)=>{
    try {
        
        const prodId=req.body.id
        const userId=req.session.user
        const findUser=await User.findOne({_id:userId})
        if(!findUser){
           res.json({error:"user not found"})
        }
        const findProduct=await Product.findOne({_id:prodId})
        const wishlist=await WishList.findOne({user:userId})
         if(wishlist){
           let exist = wishlist.products.find(product => product.itemId.toString() === prodId)
           if(exist){
            return res.json({status: false, message:"product already existed in the wishlist"})
           }
            

        }
        
        const updatedWishList = await WishList.findOneAndUpdate(
            {
            user:userId
        },{
            $push:{
             products:{itemId:prodId}
            }
        },
        {
            upsert:true, new: true 
        }
    )
    res.json({ status: true })

    } catch (error) {
        console.log(error)
        
    }
}

const deleteWishList=async(req,res)=>{
    try {
        const productId=req.query.id
        const userId=req.session.user
        await WishList.findOneAndUpdate({user:userId},
            {$pull:{products:{itemId:productId}}},{new:true})
            res.redirect("/wishlist")
    } catch (error) {
        console.log(error)
    }
}


module.exports={
    getWishListPage ,
    addToWishList,
    deleteWishList
}