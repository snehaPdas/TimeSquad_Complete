const mongoose=require("mongoose")
const env = require('dotenv')
env.config()

const ConnectDB=async()=>{
    try{
        await mongoose.connect(process.env.MONGO)
        
        console.log("DataBase conneted")
    }catch(error){
        console.log(error)
    }
}
module.exports=ConnectDB
