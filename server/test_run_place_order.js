import "dotenv/config";
import mongoose from "mongoose";
import { placeOrder } from "./controllers/orderController.js";
import { Connectdb } from "./configs/db.js";

const req = {
  body: {
    userId: "66123456789abcdef0000001",
    address: {
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      street: "123 Main St",
      city: "Mumbai",
      state: "MH",
      pincode: "400001",
      country: "India",
      phone: "9876543210"
    },
    items: [
      {
        _id: "693da7172835d0b3107356dc",
        name: "Greek salad",
        price: 12,
        quantity: 1
      }
    ],
    amount: 14,
    couponCode: ""
  }
};

const res = {
  json: (data) => {
    console.log("Response JSON:", data);
    process.exit(0);
  }
};

async function start() {
  try {
    await Connectdb();
    console.log("Running placeOrder controller...");
    
    // Inject a console wrapper to see if placeOrder logs anything
    const originalConsoleLog = console.log;
    console.log = function(...args) {
      originalConsoleLog.apply(console, ["LOG:", ...args]);
    };
    
    await placeOrder(req, res);
  } catch (error) {
    console.error("Direct execution catch:", error);
    process.exit(1);
  }
}

start();
