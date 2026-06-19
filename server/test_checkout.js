import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const token = jwt.sign({ userId: "66123456789abcdef0000001" }, process.env.JWT_SECRET || "IamTheBeast%43#@");

const orderData = {
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
};

async function run() {
  try {
    const res = await fetch("http://localhost:4000/api/order/place", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": token
      },
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.log("Error message:", err.message);
  }
}

run();
