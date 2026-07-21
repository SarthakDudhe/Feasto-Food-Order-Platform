import express from "express"
import { loginRider, registerRider, listRiders, verifyRider, updateRiderAccountStatus, updateVerificationParameters, addMisconductReport } from "../controllers/riderController.js"

const riderRouter = express.Router()

riderRouter.post("/register", registerRider)
riderRouter.post("/login", loginRider)
riderRouter.get("/list", listRiders)
riderRouter.post("/verify", verifyRider)
riderRouter.post("/update-status", updateRiderAccountStatus)
riderRouter.post("/update-verification", updateVerificationParameters)
riderRouter.post("/add-misconduct", addMisconductReport)

export default riderRouter;
