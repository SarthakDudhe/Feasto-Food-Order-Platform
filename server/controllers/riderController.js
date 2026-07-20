import riderModel from "../models/riderModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

// login rider
const loginRider = async (req, res) => {
    const { email, password } = req.body;
    try {
        const rider = await riderModel.findOne({ email });
        if (!rider) {
            return res.json({ success: false, message: "Rider doesn't exist" })
        }
        const isMatch = await bcrypt.compare(password, rider.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" })
        }
        const token = createToken(rider._id);
        res.json({ success: true, token, rider: { _id: rider._id, name: rider.name, email: rider.email } })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

// register rider
const registerRider = async (req, res) => {
    const { name, password, email, phone, vehicleType } = req.body;
    try {
        const exists = await riderModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "Rider already exists" })
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt);

        const newRider = new riderModel({
            name: name,
            email: email,
            password: hashedPassword,
            phone: phone,
            vehicleType: vehicleType || "Scooter"
        })
        const rider = await newRider.save()
        const token = createToken(rider._id)
        res.json({ success: true, token })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// list riders for admin
const listRiders = async (req, res) => {
    try {
        const riders = await riderModel.find({}).select("-password");
        res.json({ success: true, data: riders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

export { loginRider, registerRider, listRiders }
