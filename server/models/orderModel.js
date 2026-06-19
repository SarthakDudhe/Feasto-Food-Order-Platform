import mongoose from "mongoose"


const orderSchema = new mongoose.Schema({
userId:{type:String,required:true},
items:{type:Array,required:true},
amount:{type:Number,required:true},
address:{type:Object,required:true},
coupon:{type:Object,default:null},
status:{type:String,default:"Food Processing"},
date:{type:Date,default:Date.now()},
payment:{type:Boolean,default:false},
riderName:{type:String,default:""}
})

const orderModel = mongoose.models.order || mongoose.model("order",orderSchema) 
export default orderModel
