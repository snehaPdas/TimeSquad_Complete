const mongoose=require("mongoose")


const wishListSchema=mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true

    },
    products:[{
        itemId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"product",
            required:true
        }
    }]
},{
    timestamps:true
})


module.exports=new mongoose.model("wishlist",wishListSchema)

