import "dotenv/config"
import express from "express";
import cors from "cors"
import { Connectdb } from "./configs/db.js";
import FoodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import AIrouter from "./routes/aiRoute.js";
import riderRouter from "./routes/riderRoute.js";
import { Server } from "socket.io";
import http from "http";



//app configs
const app = express()
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});
const port = 4000;

// Socket.io connection logic
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Join a room specific to the order
  socket.on("join_order_room", (orderId) => {
    socket.join(orderId);
    console.log(`User with ID: ${socket.id} joined room: ${orderId}`);
  });

  // Handle sending a message
  socket.on("send_message", (data) => {
    // data = { orderId, sender, text, timestamp }
    socket.to(data.orderId).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

//middlewares
app.use(express.json())
app.use(cors())


//DB connection
Connectdb();
//api endpoints
app.use("/api/food",FoodRouter)
app.use("/images",express.static("uploads"))
app.use("/api/user",userRouter)
app.use("/api/cart",cartRouter)
app.use("/api/order",orderRouter)
app.use("/api/ai",AIrouter)
app.use("/api/rider",riderRouter)

app.get("/",(req,res)=>{
res.send("Server is Live !")
})

server.listen(port,()=>{
  console.log(`Server is live at port ${port}`)
})