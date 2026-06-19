import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js"
import Stripe from "stripe"
import { getCouponDiscount } from "../utils/coupons.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)


//Placing user Order from frontend
const placeOrder = async (req,res) => {

const frontend_url = "https://feasto-food-delivery-platform.onrender.com"

  try {
    const subtotal = req.body.items.reduce((total,item)=>total + (item.price * item.quantity),0);
    const deliveryFee = subtotal === 0 ? 0 : 2;
    const { coupon, discount } = getCouponDiscount(req.body.couponCode,subtotal);
    const orderAmount = subtotal - discount + deliveryFee;

    const newOrder = new orderModel({
        userId:req.body.userId,
        items:req.body.items,
        amount:orderAmount,
        address:req.body.address,
        coupon:coupon ? {
            code:coupon.code,
            discount
        } : null
    })

await newOrder.save();
await userModel.findByIdAndUpdate(req.body.userId,{cartData:{}});

const line_Items = req.body.items.map((item)=>({
price_data:{
    currency:"inr",
    product_data:{
        name:item.name
    },
    unit_amount:item.price*100*90
},
quantity:item.quantity
}))

if (deliveryFee > 0) {
line_Items.push({
    price_data:{
        currency:"inr",
        product_data:{
            name:"Delivery Charges"
        },
        unit_amount:deliveryFee*100*90
    },
    quantity:1
})
}

const sessionConfig = {
    line_items:line_Items,
    mode:"payment",
    success_url:`${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
       cancel_url:`${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
}

if (coupon && discount > 0) {
    const stripeCoupon = await stripe.coupons.create({
        amount_off:Math.round(discount*100*90),
        currency:"inr",
        duration:"once",
        name:`${coupon.code} discount`
    })

    sessionConfig.discounts = [{coupon:stripeCoupon.id}]
}

const session = await stripe.checkout.sessions.create(sessionConfig)

res.json({success:true,session_url:session.url})

  } catch (error) {
        console.log(error.message)
    res.json({success:false,message:"Error"})
  }  
}


const verifyOrder = async (req,res) => {
     const{orderId,success}=req.body;
    try {
       if (success == "true") {
        await orderModel.findByIdAndUpdate(orderId,{payment:true});
        res.json({success:true,message:"Paid"})
       }
       else{
        await orderModel.findByIdAndDelete(orderId);
        res.json({success:false,message:"Payment Failed"})
       }


    } catch (error) {
                console.log(error.message)
    res.json({success:false,message:"Error"})
    }
}

//User Orders for Frontend
const userOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({userId:req.body.userId})
        res.json({success:true,data:orders})
    } catch (error) {
    console.log(error.message)
    res.json({success:false,message:"Error"}) 
    }
}

//List orders for admin panel
const listOrders = async (req,res) => {
    try {
     const orders = await orderModel.find({})
    res.json({success:true,data:orders})    
    } catch (error) {
          console.log(error.message)
    res.json({success:false,message:"Error"})   
    }
   
}

//Api for updating the order status
const updateStatus = async (req,res) => {
    try {
     
        const order = await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status})
        res.json({success:true,message:"Status Updated Successfully"})
    } catch (error) {
    console.log(error.message)
    res.json({success:false,message:"Error"})     
    }
}

// Retrieve a single order detail
const getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await orderModel.findById(orderId);
    
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Security check: ensure order belongs to requesting user
    if (order.userId !== req.body.userId) {
      return res.json({ success: false, message: "Unauthorized access to order" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: "Error" });
  }
}

export {placeOrder,verifyOrder,userOrders,listOrders,updateStatus,getOrderDetail}
