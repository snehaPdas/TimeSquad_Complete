const { default: mongoose } = require("mongoose")

const offerSchema=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    discountOn:{
        type:String,
        enum:["product","category"],
        required:true,
    },
    DiscountValue:{
        type:Number,
        required:true
    },
    isActive:{
        type:Boolean,
        default:true
    },
    expireOn:{
        type:Date,
        require:true
    },
    discountedProduct:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"product"
    },
    discountedCategory:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"category"
    }
},
{

    timestamps:true
})
module.exports=new mongoose.model("offer",offerSchema)