const express=require("express")
const path=require("path")
const session=require("express-session")
//const nocache = require("nocache")


const userRoute=require("./routes/userroute")
const adminRoute=require("./routes/adminroute")
const ConnectDB = require("./database/connection")

ConnectDB()



const app=express()
const PORT = process.env.PORT || 5200

app.use(express.static(path.join(__dirname,"/public")))

app.use(express.json())
app.use(express.urlencoded({extended:true}))


app.use(session({
    secret:"timesquad",
    resave:false,
    saveUninitialized:false
}))

app.set("view engine","ejs")



app.use("/",userRoute)
app.use("/admin",adminRoute)




app.listen(PORT, () => console.log(`Server running on  http://localhost:${PORT}`))

