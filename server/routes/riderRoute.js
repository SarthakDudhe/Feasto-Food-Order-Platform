import express from "express"
import { loginRider, registerRider, listRiders } from "../controllers/riderController.js"

const riderRouter = express.Router()

riderRouter.post("/register", registerRider)
riderRouter.post("/login", loginRider)
riderRouter.get("/list", listRiders)

export default riderRouter;
