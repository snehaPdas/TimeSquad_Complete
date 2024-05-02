const mongoose = require("mongoose");


const orderSchema = mongoose.Schema({
    userId: { type: String, required: true }, 
    products: [{ 
        product: { type: mongoose.Schema.Types.ObjectId, 
          ref: "product" }, 
        quantity: { type: Number } 
    }],
    totalPrice: { type: Number,
       required: true },
       address: [{
        addressType: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        landMark: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pincode: {
            type: Number,
            required: true
        },
        phone: {
            type: Number,
            required: true
        },
        altPhone: {
            type: Number,
            required: true
        }
    }],
    payment: { type: String, required: true }, 
    orderStatus: { 
        type: String,
        enum: [
            'pending',
            'confirmed',
            'shipped',
            'delivered',
            'canceled',
            'returned',
        ],
        default: 'pending',
    },
   cancellationReason:{
   type:String,
  },

    createdOn : {
       type:String
    
    },
    date : {
        
        type : String,
    },
    deliveryDate:{
        type:String,
    },
    
}, 
{ timestamps: true }
);




const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
