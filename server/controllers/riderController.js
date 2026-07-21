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
        if (rider.accountStatus === "Pending") {
            return res.json({ success: false, message: "Your account is pending admin approval." })
        }
        if (rider.accountStatus === "Suspended") {
            return res.json({ success: false, message: "Your account is temporarily suspended." })
        }
        if (rider.accountStatus === "Blocked") {
            return res.json({ success: false, message: "Your account is blocked for policy violations." })
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
        // Do not log them in automatically. They must wait for verification.
        res.json({ success: true, message: "Registration successful. Pending admin approval." })
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

// verify rider (Legacy Admin verification - deprecated but updated to use accountStatus)
const verifyRider = async (req, res) => {
    try {
        const { riderId } = req.body;
        const rider = await riderModel.findById(riderId);
        if (!rider) {
            return res.json({ success: false, message: "Rider not found" });
        }
        rider.accountStatus = "Active";
        rider.verificationDetails = {
            idVerified: true,
            vehicleDocsVerified: true,
            backgroundCheckPassed: true
        };
        await rider.save();
        res.json({ success: true, message: "Rider successfully verified!" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error verifying rider" });
    }
}

// update rider account status
const updateRiderAccountStatus = async (req, res) => {
    try {
        const { riderId, status } = req.body;
        const rider = await riderModel.findById(riderId);
        if (!rider) {
            return res.json({ success: false, message: "Rider not found" });
        }
        if (!["Pending", "Active", "Suspended", "Blocked"].includes(status)) {
            return res.json({ success: false, message: "Invalid status" });
        }
        rider.accountStatus = status;
        await rider.save();
        res.json({ success: true, message: `Rider account marked as ${status}` });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error updating account status" });
    }
}

// update verification parameters
const updateVerificationParameters = async (req, res) => {
    try {
        const { riderId, idVerified, vehicleDocsVerified, backgroundCheckPassed } = req.body;
        const rider = await riderModel.findById(riderId);
        if (!rider) {
            return res.json({ success: false, message: "Rider not found" });
        }
        
        rider.verificationDetails.idVerified = idVerified;
        rider.verificationDetails.vehicleDocsVerified = vehicleDocsVerified;
        rider.verificationDetails.backgroundCheckPassed = backgroundCheckPassed;
        
        // Auto-activate if all three are passed and currently pending
        if (idVerified && vehicleDocsVerified && backgroundCheckPassed && rider.accountStatus === "Pending") {
            rider.accountStatus = "Active";
        }
        
        await rider.save();
        res.json({ success: true, message: "Verification details updated", rider });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error updating verification details" });
    }
}

// add misconduct report
const addMisconductReport = async (req, res) => {
    try {
        const { riderId, reason, severity } = req.body;
        if (!reason || !severity) {
            return res.json({ success: false, message: "Reason and severity are required" });
        }

        const rider = await riderModel.findById(riderId);
        if (!rider) {
            return res.json({ success: false, message: "Rider not found" });
        }

        rider.misconductReports.push({ reason, severity, date: new Date() });
        
        // Example Automated Rule: Suspend if High severity
        if (severity === "High" && rider.accountStatus === "Active") {
            rider.accountStatus = "Suspended";
        }

        await rider.save();
        res.json({ success: true, message: "Misconduct report added successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error adding misconduct report" });
    }
}

export { loginRider, registerRider, listRiders, verifyRider, updateRiderAccountStatus, updateVerificationParameters, addMisconductReport }
