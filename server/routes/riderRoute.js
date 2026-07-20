import express from "express"
import { loginRider, registerRider, listRiders, verifyRider } from "../controllers/riderController.js"

const riderRouter = express.Router()

riderRouter.post("/register", registerRider)
riderRouter.post("/login", loginRider)
riderRouter.get("/list", listRiders)
riderRouter.post("/verify", verifyRider)

export default riderRouter;
