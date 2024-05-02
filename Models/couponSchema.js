const mongoose=require("mongoose")
const couponSchema=mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    code:{
        type:String,
        required:true
    },
    offerPrice:{
        type:Number,
        require:true,
    },
    minimumPrice : {
        type : Number,
        required : true
    },
    expireOn:{
        type:Date,
        require:true
    },
    userId:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }],
    
    isListed:{
        type:Boolean,
        default:true
    },
   
},
{
    timestamps:true
})

    module.exports=new mongoose.model("coupon",couponSchema)