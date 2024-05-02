const Product=require("../Models/productSchema")
const User=require("../Models/userSchema")
const razorpay=require("razorpay")

let instance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})


const addMoneyToWallet = async (req, res) => {
    try {
        var options = {
            amount: req.body.total * 100,
            currency: "INR",
            receipt: "" + Date.now(),
        };
        instance.orders.create(options, async function (err, order) {
            if (err) {
                console.log("Error while creating order : ", err);
            } else {
                var amount = order.amount / 100;
                await User.updateOne({_id: req.session.user},
                    {
                        $push : {
                            history : {
                                amount : amount,
                                 status : "credit",
                                  date : Date.now()
                            }
                        }
                    
                    })
                    const updatedUser = await User.findById(req.session.user);
                    
                
            }
            
            res.json({order : order, razorpay : true})
        })
    } catch (error) {
        console.log(error.message);
    }
}
const verify_payment = async (req, res)=>{
    
    try {
        let details = req.body
        let amount = parseInt(details.order.order.amount) / 100
        await User.updateOne(
            {_id : req.session.user},
            {$inc : {wallet : amount}}
        )
        res.json({success : true})
    } catch (error) {
        console.log(error.message);
    }}



module.exports={
    addMoneyToWallet,
    verify_payment
}