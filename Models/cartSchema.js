const mongoose=require("mongoose")
const cartSchema=mongoose.Schema({
    user:{
       type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

   items:[{

    product:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"product"
    },

    quantity:{
        type:Number,
        default:1

    },
    price:{
     type:Number,
     default:0,
     required:true

    }
}],
coupon:{
type:String,
default:null,
},

totalQuantity:{
    type:Number,
    required:true,

},
totalPrice:{
    type:Number,
   required:true
}
},

{

timestamps:true
})

const cartModel=mongoose.model("Cart",cartSchema)
module.exports=cartModel