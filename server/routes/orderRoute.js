import express from "express";
import { listOrders, placeOrder, updateStatus, userOrders, verifyOrder, getOrderDetail, getOrderAnalytics, assignRider, updateRiderLocation, verifyDeliveryOtp, addChatMessage } from "../controllers/orderController.js";
import authMiddleware from "../middleware/auth.js"

const orderRouter = express.Router()

orderRouter.post("/place",authMiddleware,placeOrder);
orderRouter.post("/verify",verifyOrder)
orderRouter.post("/userOrders",authMiddleware,userOrders)
orderRouter.post("/detail",authMiddleware,getOrderDetail)
orderRouter.get("/list",listOrders)
orderRouter.post("/status",updateStatus)
orderRouter.get("/analytics",getOrderAnalytics)
orderRouter.post("/assign",assignRider)
orderRouter.post("/update-location",updateRiderLocation)
orderRouter.post("/verify-delivery", verifyDeliveryOtp)
orderRouter.post("/chat", addChatMessage)

export default orderRouter;