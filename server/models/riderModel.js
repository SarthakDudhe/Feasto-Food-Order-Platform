import mongoose from "mongoose";

const riderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  vehicleType: { type: String, default: "Scooter" },
  status: { type: String, default: "Available" },
  accountStatus: { type: String, enum: ["Pending", "Active", "Suspended", "Blocked"], default: "Pending" },
  verificationDetails: {
    idVerified: { type: Boolean, default: false },
    vehicleDocsVerified: { type: Boolean, default: false },
    backgroundCheckPassed: { type: Boolean, default: false }
  },
  misconductReports: [
    {
      date: { type: Date, default: Date.now },
      reason: { type: String, required: true },
      severity: { type: String, enum: ["Low", "Medium", "High"], required: true }
    }
  ]
}, { minimize: false });

const riderModel = mongoose.models.rider || mongoose.model("rider", riderSchema);
export default riderModel;
