const mongoose=require("mongoose")
const categorySchema=mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
        },
        description:{
            type:String,
            required:true
        },
        isListed:{
            type:Boolean,
            default:true
        }

})
module.exports=mongoose.model("category",categorySchema)